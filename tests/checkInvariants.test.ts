import { spawnSync } from 'node:child_process';
import { basename, dirname, join } from 'node:path';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const gateScript = fileURLToPath(
  new URL('../scripts/check-invariants.mjs', import.meta.url),
);

interface GateResult {
  status: number | null;
  output: string;
}

interface ExpectedLocation {
  path: string;
  line: number;
}

async function runGateInTemporaryProject(
  sourceFiles: Record<string, string>,
): Promise<GateResult> {
  const projectDirectory = await mkdtemp(join(tmpdir(), 'mia-invariants-'));
  const sourceDirectory = join(projectDirectory, 'src');

  try {
    await mkdir(sourceDirectory, { recursive: true });

    for (const [relativePath, contents] of Object.entries(sourceFiles)) {
      const targetPath = join(sourceDirectory, relativePath);
      await mkdir(dirname(targetPath), { recursive: true });
      await writeFile(targetPath, contents, 'utf8');
    }

    const result = spawnSync(process.execPath, [gateScript], {
      cwd: projectDirectory,
      encoding: 'utf8',
    });

    if (result.error) {
      throw result.error;
    }

    return {
      status: result.status,
      output: `${result.stdout ?? ''}\n${result.stderr ?? ''}`,
    };
  } finally {
    await rm(projectDirectory, { recursive: true, force: true });
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function expectLocation(output: string, relativePath: string, line: number): void {
  const fileName = escapeRegExp(basename(relativePath));
  const lineNumber = escapeRegExp(String(line));
  const fileThenLine = new RegExp(
    `${fileName}[\\s\\S]{0,120}(?:^|\\D)${lineNumber}(?:\\D|$)`,
    'i',
  );
  const lineThenFile = new RegExp(
    `(?:^|\\D)${lineNumber}(?:\\D|$)[\\s\\S]{0,120}${fileName}`,
    'i',
  );

  expect(
    fileThenLine.test(output) || lineThenFile.test(output),
    `Se esperaba que la salida reportara ${relativePath}:${line}`,
  ).toBe(true);
}

async function expectGateRejection(
  sourceFiles: Record<string, string>,
  expectedLocations: ExpectedLocation[],
): Promise<void> {
  const result = await runGateInTemporaryProject(sourceFiles);

  expect(result.status).not.toBe(0);

  for (const location of expectedLocations) {
    expectLocation(result.output, location.path, location.line);
  }
}

const cleanAllowlistProject = {
  'types.ts': [
    'export type SqlText = string;',
    '',
  ].join('\n'),
  'reservas/reservas.queries.ts': [
    "import type { SqlText } from '../types.js';",
    '',
    '// Los tokens `join`, concat, replace y + dentro de comentarios no construyen SQL.',
    "export const LIST_RESERVAS: SqlText = 'SELECT id_booking FROM reservations WHERE id_agente = ?';",
    "export const TOTAL_RESERVAS = 'SELECT subtotal + taxes AS total FROM reservations';",
    "export const NAME_QUERY = 'SELECT CONCAT(first_name, CHAR(32), last_name) AS full_name FROM travelers';",
    "export const ORDER_QUERY = 'SELECT CASE WHEN active = 1 THEN id_booking ELSE NULL END FROM reservations';",
    "export const LEGACY_ALIAS_QUERY = 'SELECT legacy_column AS `legacy` FROM reservations';",
    '',
  ].join('\n'),
  'reservas/reservas.repository.ts': [
    "import { LIST_RESERVAS, TOTAL_RESERVAS } from './reservas.queries.js';",
    '',
    'export function findByAgentAndCount(',
    '  executor: { execute: (sql: string, params: unknown[]) => unknown },',
    '  idAgente: string,',
    ') {',
    '  executor.execute(LIST_RESERVAS, [idAgente]);',
    '  return executor.execute(TOTAL_RESERVAS, [idAgente]);',
    '}',
    '',
  ].join('\n'),
  'reservas/reservas.schemas.ts': [
    'export declare const bodySchema: { parse: (input: unknown) => unknown };',
    'export declare const querySchema: { parse: (input: unknown) => unknown };',
    'export declare const paramsSchema: { parse: (input: unknown) => unknown };',
    '',
  ].join('\n'),
  'reservas/reservas.controller.ts': [
    "import { bodySchema, paramsSchema, querySchema } from './reservas.schemas.js';",
    '',
    'export function handle(req: any) {',
    '  const body = bodySchema.parse(req.body);',
    '  const query = querySchema.parse(req.query);',
    '  const params = paramsSchema.parse(req.params);',
    '  const idAgente = req.context.id_agente;',
    '  return { body, query, params, idAgente };',
    '}',
    '',
  ].join('\n'),
  'core/middleware/auth.ts': [
    "import type { Request } from 'express';",
    '',
    'export interface RequestContext {',
    '  id_agente: string;',
    '}',
    '',
    'export interface ContextResolver {',
    '  resolve(req: Request): Promise<RequestContext>;',
    '}',
    '',
    'export async function authenticate(',
    '  req: Request & { context?: RequestContext },',
    '  contextResolver: ContextResolver,',
    ') {',
    '  req.context = await contextResolver.resolve(req);',
    '}',
    '',
  ].join('\n'),
  'observability.ts': [
    'export function record(logger: any, commandBus: any) {',
    "  logger.query('cache-hit');",
    "  commandBus.execute('health-check');",
    '}',
    '',
  ].join('\n'),
};

const queryGrammarViolations = {
  'dynamic-template.queries.ts': [
    "const table = 'reservations';",
    'export const DYNAMIC_QUERY = `SELECT * FROM ${table}`;',
    '',
  ].join('\n'),
  'dynamic-concatenation.queries.ts': [
    "const table = 'reservations';",
    "export const DYNAMIC_QUERY = 'SELECT * FROM ' + table;",
    '',
  ].join('\n'),
  'dynamic-string-method.queries.ts': [
    "const table = 'reservations';",
    "export const DYNAMIC_QUERY = 'SELECT * FROM '.concat(table);",
    '',
  ].join('\n'),
  'dynamic-array-method.queries.ts': [
    "const fields = ['id_booking', 'id_agente'];",
    "export const DYNAMIC_QUERY = ['SELECT', fields.join(', '), 'FROM reservations'].join(' ');",
    '',
  ].join('\n'),
  'dynamic-conditional.queries.ts': [
    "const includeArchived = process.env.INCLUDE_ARCHIVED === '1';",
    "export const DYNAMIC_QUERY = includeArchived ? 'SELECT * FROM reservations' : 'SELECT id_booking FROM reservations';",
    '',
  ].join('\n'),
  'dynamic-replace.queries.ts': [
    '// desviación',
    "export const DYNAMIC_QUERY = 'SELECT __field__ FROM reservations'.replace('__field__', 'id_booking');",
    '',
  ].join('\n'),
  'function.queries.ts': [
    '// desviación',
    "export function buildQuery() { return 'SELECT id_booking FROM reservations'; }",
    '',
  ].join('\n'),
  'environment.queries.ts': [
    '// desviación',
    'export const DYNAMIC_QUERY = process.env.SQL_QUERY;',
    '',
  ].join('\n'),
  'reassignment.queries.ts': [
    '// desviación',
    "export let DYNAMIC_QUERY = 'SELECT id_booking FROM reservations'; DYNAMIC_QUERY = 'SELECT total FROM reservations';",
    '',
  ].join('\n'),
  'dynamic-property.queries.ts': [
    '// desviación',
    "export const DYNAMIC_QUERY = ({ sql: 'SELECT id_booking FROM reservations' } as Record<string, string>)['sql'];",
    '',
  ].join('\n'),
  'non-exported.queries.ts': [
    '// desviación',
    "const PRIVATE_QUERY = 'SELECT id_booking FROM reservations';",
    '',
  ].join('\n'),
  'variable-reference.queries.ts': [
    "const QUERY_TEXT = 'SELECT id_booking FROM reservations';",
    'export const DYNAMIC_QUERY = QUERY_TEXT;',
    '',
  ].join('\n'),
};

const queryGrammarLocations: ExpectedLocation[] = Object.keys(
  queryGrammarViolations,
).map((path) => ({ path, line: 2 }));

const clientReadViolations: Record<string, string> = {};
const clientReadLocations: ExpectedLocation[] = [];

for (const source of ['body', 'query', 'params'] as const) {
  const fixtures = {
    [`alternate-request-${source}.ts`]: [
      'export function read(httpRequest: any) {',
      `  return httpRequest.${source}.id_agente;`,
      '}',
      '',
    ].join('\n'),
    [`aliased-${source}.ts`]: [
      'export function read(httpRequest: any) {',
      `  const clientInput = httpRequest.${source}; return clientInput.id_agente;`,
      '}',
      '',
    ].join('\n'),
    [`nested-destructuring-${source}.ts`]: [
      'export function read(httpRequest: any) {',
      `  const { ${source}: { id_agente } } = httpRequest; return id_agente;`,
      '}',
      '',
    ].join('\n'),
    [`computed-key-${source}.ts`]: [
      'export function read(httpRequest: any) {',
      `  const key = 'id_agente'; return httpRequest.${source}[key];`,
      '}',
      '',
    ].join('\n'),
    [`reflection-${source}.ts`]: [
      'export function read(httpRequest: any) {',
      `  return Reflect.get(httpRequest.${source}, 'id_agente');`,
      '}',
      '',
    ].join('\n'),
  };

  Object.assign(clientReadViolations, fixtures);
  clientReadLocations.push(
    ...Object.keys(fixtures).map((path) => ({ path, line: 2 })),
  );
}

const repositoryGrammarViolations = {
  'approved.queries.ts': [
    "export const APPROVED_QUERY = 'SELECT id_booking FROM reservations WHERE id_agente = ?';",
    '',
  ].join('\n'),
  'constants.ts': [
    "export const WRONG_SOURCE_QUERY = 'SELECT id_booking FROM reservations';",
    '',
  ].join('\n'),
  'literal-execution.ts': [
    '// desviación',
    "export function run(executor: any, params: unknown[]) { return executor.execute('SELECT id_booking FROM reservations', params); }",
    '',
  ].join('\n'),
  'intermediate-query.ts': [
    "import { APPROVED_QUERY } from './approved.queries.js';",
    'export function run(executor: any, params: unknown[]) { const sql = APPROVED_QUERY; return executor.execute(sql, params); }',
    '',
  ].join('\n'),
  'intermediate-executor.ts': [
    "import { APPROVED_QUERY } from './approved.queries.js';",
    'export function run(executor: any, params: unknown[]) { const db = executor; return db.execute(APPROVED_QUERY, params); }',
    '',
  ].join('\n'),
  'destructured-execute.ts': [
    "import { APPROVED_QUERY } from './approved.queries.js';",
    'export function run(executor: any, params: unknown[]) { const { execute } = executor; return execute(APPROVED_QUERY, params); }',
    '',
  ].join('\n'),
  'bound-execute.ts': [
    "import { APPROVED_QUERY } from './approved.queries.js';",
    'export function run(executor: any, params: unknown[]) { const execute = executor.execute.bind(executor); return execute(APPROVED_QUERY, params); }',
    '',
  ].join('\n'),
  'called-execute.ts': [
    "import { APPROVED_QUERY } from './approved.queries.js';",
    'export function run(executor: any, params: unknown[]) { return executor.execute.call(executor, APPROVED_QUERY, params); }',
    '',
  ].join('\n'),
  'computed-execute.ts': [
    "import { APPROVED_QUERY } from './approved.queries.js';",
    "export function run(executor: any, params: unknown[]) { const method = 'execute'; return executor[method](APPROVED_QUERY, params); }",
    '',
  ].join('\n'),
  'query-method.ts': [
    "import { APPROVED_QUERY } from './approved.queries.js';",
    'export function run(executor: any, params: unknown[]) { return executor.query(APPROVED_QUERY, params); }',
    '',
  ].join('\n'),
  'aliased-import.ts': [
    "import { APPROVED_QUERY as QUERY_ALIAS } from './approved.queries.js';",
    'export function run(executor: any, params: unknown[]) { return executor.execute(QUERY_ALIAS, params); }',
    '',
  ].join('\n'),
  'wrong-import-source.ts': [
    "import { WRONG_SOURCE_QUERY } from './constants.js';",
    'export function run(executor: any, params: unknown[]) { return executor.execute(WRONG_SOURCE_QUERY, params); }',
    '',
  ].join('\n'),
};

const repositoryGrammarLocations: ExpectedLocation[] = Object.keys(
  repositoryGrammarViolations,
)
  .filter((path) => !path.endsWith('.queries.ts') && path !== 'constants.ts')
  .map((path) => ({ path, line: 2 }));

const controllerValidationViolations: Record<string, string> = {};
const controllerValidationLocations: ExpectedLocation[] = [];

for (const source of ['body', 'query', 'params'] as const) {
  const fixtures = {
    [`aliased-raw-${source}.controller.ts`]: [
      "import { schema } from './schema.js';",
      `export function handle(req: any) { const raw = req.${source}; return schema.parse(raw); }`,
      '',
    ].join('\n'),
    [`destructured-raw-${source}.controller.ts`]: [
      "import { schema } from './schema.js';",
      `export function handle(req: any) { const { value } = req.${source}; return schema.parse({ value }); }`,
      '',
    ].join('\n'),
    [`spread-raw-${source}.controller.ts`]: [
      "import { schema } from './schema.js';",
      `export function handle(req: any) { return schema.parse({ ...req.${source} }); }`,
      '',
    ].join('\n'),
    [`unvalidated-${source}.controller.ts`]: [
      '// desviación',
      `export function handle(req: any) { return req.${source}.value; }`,
      '',
    ].join('\n'),
  };

  Object.assign(controllerValidationViolations, fixtures);
  controllerValidationLocations.push(
    ...Object.keys(fixtures).map((path) => ({ path, line: 2 })),
  );
}

const contextBoundaryCases: Array<{
  sourceFiles: Record<string, string>;
  location: ExpectedLocation;
}> = [
  {
    sourceFiles: {
      'controller-created-context.ts': [
        '// desviación',
        "export function handle(req: any) { req.context = { id_agente: 'ce57342e-03e9-440f-b12f-16497f23b8bb' }; }",
        '',
      ].join('\n'),
    },
    location: { path: 'controller-created-context.ts', line: 2 },
  },
  {
    sourceFiles: {
      'core/middleware/authentication.ts': [
        '// desviación',
        'export async function authenticate(req: any, contextResolver: any) { req.context = await contextResolver.resolve(req); }',
        '',
      ].join('\n'),
    },
    location: { path: 'core/middleware/authentication.ts', line: 2 },
  },
  {
    sourceFiles: {
      'core/middleware/auth.ts': [
        '// desviación',
        "export function authenticate(req: any) { req.context = { id_agente: req.headers['x-id-agente'] }; }",
        '',
      ].join('\n'),
    },
    location: { path: 'core/middleware/auth.ts', line: 2 },
  },
  {
    sourceFiles: {
      'core/middleware/auth.ts': [
        '// desviación',
        'export async function authenticate(req: any, contextResolver: { resolve: (req: any) => Promise<string> }) { const id_agente = await contextResolver.resolve(req); req.context = { id_agente }; }',
        '',
      ].join('\n'),
    },
    location: { path: 'core/middleware/auth.ts', line: 2 },
  },
  {
    sourceFiles: {
      'core/middleware/auth.ts': [
        '// desviación',
        'export function authenticate(req: any, contextResolver: any) { req.context = contextResolver.resolve(req); }',
        '',
      ].join('\n'),
    },
    location: { path: 'core/middleware/auth.ts', line: 2 },
  },
  {
    sourceFiles: {
      'core/middleware/auth.ts': [
        '// desviación',
        "export async function authenticate(req: any, contextResolver: any) { req.context = await contextResolver.resolve(req.headers['x-id-agente']); }",
        '',
      ].join('\n'),
    },
    location: { path: 'core/middleware/auth.ts', line: 2 },
  },
];

describe('scripts/check-invariants.mjs', () => {
  it('acepta exactamente la gramática permitida sin falsos positivos', async () => {
    const result = await runGateInTemporaryProject(cleanAllowlistProject);

    expect(result.status).toBe(0);
  });

  it('rechaza toda desviación de la gramática de archivos queries', async () => {
    await expectGateRejection(
      queryGrammarViolations,
      queryGrammarLocations,
    );
  });

  it('rechaza lecturas indirectas de id_agente desde body, query y params', async () => {
    await expectGateRejection(clientReadViolations, clientReadLocations);
  });

  it('rechaza toda desviación de la ejecución directa desde el catálogo', async () => {
    await expectGateRejection(
      repositoryGrammarViolations,
      repositoryGrammarLocations,
    );
  });

  it('rechaza controladores que transforman o consumen input HTTP antes de validarlo', async () => {
    await expectGateRejection(
      controllerValidationViolations,
      controllerValidationLocations,
    );
  });

  it('rechaza la creación de req.context fuera de auth.ts o sin ContextResolver', async () => {
    for (const testCase of contextBoundaryCases) {
      await expectGateRejection(testCase.sourceFiles, [testCase.location]);
    }
  });
});
