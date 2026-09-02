import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import ts from "typescript";

const SOURCE_ROOT = path.resolve(process.cwd(), "src");
const QUERY_FILE_SUFFIX = ".queries.ts";
const REPOSITORY_FILE_SUFFIX = ".repository.ts";
const AUTH_MIDDLEWARE_PATH = "src/core/middleware/auth.ts";
const HTTP_INPUT_PROPERTIES = new Set(["body", "query", "params"]);
const SQL_METHODS = new Set(["execute", "query"]);
const ASSIGNMENT_OPERATORS = new Set([
  ts.SyntaxKind.EqualsToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
]);

function compareText(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function unwrapExpression(node) {
  let current = node;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isNonNullExpression(current) ||
    ts.isSatisfiesExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function accessTarget(node) {
  if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
    return unwrapExpression(node.expression);
  }
  return undefined;
}

function literalPropertyName(node) {
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  if (!ts.isElementAccessExpression(node) || node.argumentExpression === undefined) {
    return undefined;
  }
  const argument = unwrapExpression(node.argumentExpression);
  return ts.isStringLiteral(argument) ? argument.text : undefined;
}

function relativeFileName(filePath) {
  return path.relative(process.cwd(), filePath).replaceAll("\\", "/");
}

function lineOf(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function addViolation(violations, filePath, sourceFile, node, code, message) {
  violations.push({
    file: relativeFileName(filePath),
    line: lineOf(sourceFile, node),
    code,
    message,
  });
}

async function collectTypeScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => compareText(left.name, right.name));

  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectTypeScriptFiles(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(entryPath);
    }
  }
  return files;
}

function hasModifier(node, modifierKind) {
  return node.modifiers?.some((modifier) => modifier.kind === modifierKind) ?? false;
}

function isTypeOnlyImport(statement) {
  const importClause = statement.importClause;
  if (importClause === undefined) return false;
  if (importClause.isTypeOnly) return true;
  if (importClause.name !== undefined || importClause.namedBindings === undefined) return false;
  if (!ts.isNamedImports(importClause.namedBindings)) return false;
  return (
    importClause.namedBindings.elements.length > 0 &&
    importClause.namedBindings.elements.every((element) => element.isTypeOnly)
  );
}

function inspectQueryCatalog(filePath, sourceFile, violations) {
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      if (!isTypeOnlyImport(statement)) {
        addViolation(
          violations,
          filePath,
          sourceFile,
          statement,
          "QUERY_CATALOG_GRAMMAR",
          "Un archivo *.queries.ts solo puede importar tipos.",
        );
      }
      continue;
    }

    if (!ts.isVariableStatement(statement)) {
      addViolation(
        violations,
        filePath,
        sourceFile,
        statement,
        "QUERY_CATALOG_GRAMMAR",
        "Un archivo *.queries.ts solo puede contener constantes exportadas con string literal.",
      );
      continue;
    }

    const isExported = hasModifier(statement, ts.SyntaxKind.ExportKeyword);
    const isDefault = hasModifier(statement, ts.SyntaxKind.DefaultKeyword);
    const isConst =
      (statement.declarationList.flags & ts.NodeFlags.Const) === ts.NodeFlags.Const;

    for (const declaration of statement.declarationList.declarations) {
      if (
        !isExported ||
        isDefault ||
        !isConst ||
        !ts.isIdentifier(declaration.name) ||
        declaration.initializer === undefined ||
        (!ts.isStringLiteral(declaration.initializer) &&
          !ts.isNoSubstitutionTemplateLiteral(declaration.initializer))
      ) {
        addViolation(
          violations,
          filePath,
          sourceFile,
          declaration,
          "QUERY_CATALOG_GRAMMAR",
          "Cada query debe ser una constante exportada cuyo valor sea un string literal estático.",
        );
      }
    }
  }
}

function isQueriesModule(moduleName) {
  return /(?:^|\/)[^/]+\.queries(?:\.(?:[cm]?js|ts))?$/u.test(
    moduleName.replaceAll("\\", "/"),
  );
}

function directQueryImports(sourceFile) {
  const names = new Set();

  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !isQueriesModule(statement.moduleSpecifier.text) ||
      statement.importClause === undefined ||
      statement.importClause.isTypeOnly ||
      statement.importClause.namedBindings === undefined ||
      !ts.isNamedImports(statement.importClause.namedBindings)
    ) {
      continue;
    }

    for (const element of statement.importClause.namedBindings.elements) {
      if (element.isTypeOnly) continue;
      const exportedName = element.propertyName?.text ?? element.name.text;
      if (exportedName === element.name.text) names.add(element.name.text);
    }
  }

  return names;
}

function isIdentifierNamed(node, name) {
  const expression = unwrapExpression(node);
  return ts.isIdentifier(expression) && expression.text === name;
}

function isExecutorLike(node) {
  const expression = unwrapExpression(node);
  if (ts.isIdentifier(expression)) return expression.text === "executor";
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text === "executor";
  return false;
}

function isExactExecutorExecute(node) {
  return (
    ts.isPropertyAccessExpression(node) &&
    node.questionDotToken === undefined &&
    node.name.text === "execute" &&
    isIdentifierNamed(node.expression, "executor")
  );
}

function validateSqlCall(
  call,
  filePath,
  sourceFile,
  importedQueries,
  violations,
) {
  const callee = unwrapExpression(call.expression);
  const firstArgument = call.arguments[0];
  const hasExactArguments = call.arguments.length === 2 && firstArgument !== undefined;
  const hasDirectQuery =
    firstArgument !== undefined &&
    ts.isIdentifier(unwrapExpression(firstArgument)) &&
    importedQueries.has(unwrapExpression(firstArgument).text);

  if (!isExactExecutorExecute(callee) || !hasExactArguments || !hasDirectQuery) {
    addViolation(
      violations,
      filePath,
      sourceFile,
      call,
      "SQL_EXECUTION_GRAMMAR",
      "SQL solo puede ejecutarse como executor.execute(QUERY_IMPORTADA_DIRECTAMENTE, params).",
    );
  }
}

function bindingContainsSqlMethod(bindingName) {
  if (!ts.isObjectBindingPattern(bindingName)) return false;
  return bindingName.elements.some((element) => {
    const name = element.propertyName ?? element.name;
    return ts.isIdentifier(name) && SQL_METHODS.has(name.text);
  });
}

function inspectSqlExecution(filePath, sourceFile, violations) {
  const importedQueries = directQueryImports(sourceFile);
  const repositoryFile = filePath.endsWith(REPOSITORY_FILE_SUFFIX);
  const reported = new Set();

  function reportOnce(node, code, message) {
    const position = node.getStart(sourceFile);
    if (reported.has(position)) return;
    reported.add(position);
    addViolation(violations, filePath, sourceFile, node, code, message);
  }

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer !== undefined &&
      isIdentifierNamed(node.initializer, "executor") &&
      (ts.isIdentifier(node.name) || bindingContainsSqlMethod(node.name))
    ) {
      reportOnce(
        node,
        "SQL_EXECUTOR_ALIAS",
        "El executor no puede asignarse, destructurarse ni enlazarse mediante aliases.",
      );
    }

    if (
      ts.isBinaryExpression(node) &&
      ASSIGNMENT_OPERATORS.has(node.operatorToken.kind) &&
      isIdentifierNamed(node.right, "executor")
    ) {
      reportOnce(
        node,
        "SQL_EXECUTOR_ALIAS",
        "El executor no puede asignarse a una variable intermedia.",
      );
    }

    if (ts.isCallExpression(node)) {
      const callee = unwrapExpression(node.expression);
      if (ts.isPropertyAccessExpression(callee) || ts.isElementAccessExpression(callee)) {
        const receiver = accessTarget(callee);
        const method = literalPropertyName(callee);
        const looksLikeSql =
          (method !== undefined && SQL_METHODS.has(method)) ||
          (ts.isElementAccessExpression(callee) && isExecutorLike(receiver));

        if (
          looksLikeSql &&
          (repositoryFile || (receiver !== undefined && isExecutorLike(receiver)))
        ) {
          validateSqlCall(node, filePath, sourceFile, importedQueries, violations);
        }
      }
    }

    if (ts.isPropertyAccessExpression(node) && isExactExecutorExecute(node)) {
      const parent = node.parent;
      if (!ts.isCallExpression(parent) || unwrapExpression(parent.expression) !== node) {
        reportOnce(
          node,
          "SQL_EXECUTOR_ALIAS",
          "executor.execute solo puede aparecer como invocación directa; bind/call y aliases están prohibidos.",
        );
      }
    }

    if (
      ts.isElementAccessExpression(node) &&
      isIdentifierNamed(node.expression, "executor")
    ) {
      reportOnce(
        node,
        "SQL_EXECUTION_GRAMMAR",
        "No se permiten claves calculadas sobre el executor.",
      );
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function typeLooksLikeRequest(typeNode) {
  if (typeNode === undefined) return false;
  if (ts.isTypeReferenceNode(typeNode)) {
    if (ts.isIdentifier(typeNode.typeName)) return typeNode.typeName.text === "Request";
    return typeNode.typeName.right.text === "Request";
  }
  return false;
}

function requestIdentifiers(sourceFile) {
  const names = new Set(["req"]);

  function visit(node) {
    if (ts.isParameter(node) && ts.isIdentifier(node.name)) {
      if (
        node.name.text === "request" ||
        node.name.text === "httpRequest" ||
        typeLooksLikeRequest(node.type)
      ) {
        names.add(node.name.text);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);

  let changed = true;
  while (changed) {
    changed = false;
    function collectAliases(node) {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.initializer !== undefined &&
        ts.isIdentifier(unwrapExpression(node.initializer)) &&
        names.has(unwrapExpression(node.initializer).text) &&
        !names.has(node.name.text)
      ) {
        names.add(node.name.text);
        changed = true;
      }
      ts.forEachChild(node, collectAliases);
    }
    collectAliases(sourceFile);
  }

  return names;
}

function isDirectZodValidation(inputAccess) {
  const parent = inputAccess.parent;
  if (!ts.isCallExpression(parent) || !parent.arguments.includes(inputAccess)) return false;
  const callee = unwrapExpression(parent.expression);
  return (
    ts.isPropertyAccessExpression(callee) &&
    callee.questionDotToken === undefined &&
    (callee.name.text === "parse" || callee.name.text === "safeParse")
  );
}

function isExactContextTenantAccess(node) {
  if (
    !ts.isPropertyAccessExpression(node) ||
    node.questionDotToken !== undefined ||
    node.name.text !== "id_agente"
  ) {
    return false;
  }
  const contextAccess = unwrapExpression(node.expression);
  return (
    ts.isPropertyAccessExpression(contextAccess) &&
    contextAccess.questionDotToken === undefined &&
    contextAccess.name.text === "context" &&
    isIdentifierNamed(contextAccess.expression, "req")
  );
}

function isAuthorizedContextAssignment(node, filePath) {
  if (relativeFileName(filePath) !== AUTH_MIDDLEWARE_PATH) return false;
  if (
    !ts.isPropertyAccessExpression(node.left) ||
    node.left.questionDotToken !== undefined ||
    node.left.name.text !== "context" ||
    !isIdentifierNamed(node.left.expression, "req") ||
    node.operatorToken.kind !== ts.SyntaxKind.EqualsToken
  ) {
    return false;
  }

  const value = unwrapExpression(node.right);
  if (!ts.isAwaitExpression(value)) return false;

  const resolverCall = unwrapExpression(value.expression);
  if (!ts.isCallExpression(resolverCall) || resolverCall.arguments.length !== 1) {
    return false;
  }
  const callee = unwrapExpression(resolverCall.expression);
  return (
    ts.isPropertyAccessExpression(callee) &&
    callee.questionDotToken === undefined &&
    callee.name.text === "resolve" &&
    isIdentifierNamed(callee.expression, "contextResolver") &&
    isIdentifierNamed(resolverCall.arguments[0], "req")
  );
}

function inspectHttpBoundary(filePath, sourceFile, violations) {
  const requests = requestIdentifiers(sourceFile);
  const reported = new Set();

  function reportOnce(node, code, message) {
    const position = node.getStart(sourceFile);
    if (reported.has(position)) return;
    reported.add(position);
    addViolation(violations, filePath, sourceFile, node, code, message);
  }

  function visit(node) {
    if (
      (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
      accessTarget(node) !== undefined &&
      ts.isIdentifier(accessTarget(node)) &&
      requests.has(accessTarget(node).text)
    ) {
      if (ts.isElementAccessExpression(node)) {
        reportOnce(
          node,
          "HTTP_BOUNDARY_GRAMMAR",
          "La petición HTTP no puede accederse mediante claves calculadas.",
        );
      } else if (
        HTTP_INPUT_PROPERTIES.has(node.name.text) &&
        !isDirectZodValidation(node)
      ) {
        reportOnce(
          node,
          "HTTP_INPUT_NOT_VALIDATED",
          "body/query/params deben pasarse crudos y directamente a Schema.parse o Schema.safeParse.",
        );
      }
    }

    if (
      (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
      literalPropertyName(node) === "id_agente" &&
      !isExactContextTenantAccess(node)
    ) {
      reportOnce(
        node,
        "TENANT_CONTEXT_GRAMMAR",
        "El tenant solo puede consumirse mediante req.context.id_agente.",
      );
    }

    if (ts.isBindingElement(node)) {
      const bindingName = node.propertyName ?? node.name;
      if (ts.isIdentifier(bindingName) && bindingName.text === "id_agente") {
        reportOnce(
          node,
          "TENANT_CONTEXT_GRAMMAR",
          "No se permite destructurar id_agente; use req.context.id_agente directamente.",
        );
      }
    }

    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer !== undefined &&
      ts.isIdentifier(unwrapExpression(node.initializer)) &&
      requests.has(unwrapExpression(node.initializer).text)
    ) {
      reportOnce(
        node,
        "HTTP_REQUEST_ALIAS",
        "La petición HTTP no puede asignarse a un alias intermedio.",
      );
    }

    if (
      ts.isBinaryExpression(node) &&
      ASSIGNMENT_OPERATORS.has(node.operatorToken.kind) &&
      (ts.isPropertyAccessExpression(node.left) || ts.isElementAccessExpression(node.left)) &&
      literalPropertyName(node.left) === "context" &&
      accessTarget(node.left) !== undefined &&
      ts.isIdentifier(accessTarget(node.left)) &&
      requests.has(accessTarget(node.left).text) &&
      !isAuthorizedContextAssignment(node, filePath)
    ) {
      reportOnce(
        node,
        "CONTEXT_CREATION_BOUNDARY",
        "req.context solo puede crearse en auth.ts mediante contextResolver.resolve(req).",
      );
    }

    if (ts.isCallExpression(node)) {
      const callee = unwrapExpression(node.expression);
      if (ts.isPropertyAccessExpression(callee)) {
        const owner = unwrapExpression(callee.expression);
        const first = node.arguments[0];
        const key = node.arguments[1];
        if (
          ts.isIdentifier(owner) &&
          (owner.text === "Reflect" || owner.text === "Object") &&
          first !== undefined &&
          ts.isIdentifier(unwrapExpression(first)) &&
          requests.has(unwrapExpression(first).text) &&
          key !== undefined &&
          ts.isStringLiteral(unwrapExpression(key)) &&
          (HTTP_INPUT_PROPERTIES.has(unwrapExpression(key).text) ||
            unwrapExpression(key).text === "context")
        ) {
          reportOnce(
            node,
            "HTTP_BOUNDARY_GRAMMAR",
            "No se permite reflexión para acceder o crear la frontera HTTP.",
          );
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

async function inspectFile(filePath, violations) {
  const sourceText = await readFile(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TS,
  );

  if (filePath.endsWith(QUERY_FILE_SUFFIX)) {
    inspectQueryCatalog(filePath, sourceFile, violations);
  }
  inspectSqlExecution(filePath, sourceFile, violations);
  inspectHttpBoundary(filePath, sourceFile, violations);
}

async function main() {
  const files = await collectTypeScriptFiles(SOURCE_ROOT);
  const violations = [];
  for (const filePath of files) await inspectFile(filePath, violations);

  violations.sort(
    (left, right) =>
      compareText(left.file, right.file) ||
      left.line - right.line ||
      compareText(left.code, right.code),
  );

  if (violations.length > 0) {
    for (const violation of violations) {
      console.error(
        `${violation.file}:${violation.line} [${violation.code}] ${violation.message}`,
      );
    }
    console.error(`Gate de invariantes: ${violations.length} violación(es).`);
    process.exitCode = 1;
    return;
  }

  console.log(`Gate de invariantes: OK (${files.length} archivo(s) analizado(s)).`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`No se pudo ejecutar el gate de invariantes: ${message}`);
  process.exitCode = 1;
});
