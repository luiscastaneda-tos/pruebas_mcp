# 💻 Brief del Agente Backend

Este es el documento que el **Lead** entrega al subagente **Backend** al arrancar cada tarea, junto con la especificación de la tarea y los contratos aprobados. Léelo completo antes de escribir código.

---

## 1. Qué construyes

Un backend REST en TypeScript sobre Express, arquitectura limpia `Router → Controller → Service → Repository`, desplegado en Vercel Serverless. Implementas desde contratos: [API_CONTRACT.md](../API_CONTRACT.md) define la forma exacta de cada request y response, y [QUERIES.md](../QUERIES.md) es la única fuente de acceso a datos.

---

## 2. Las tres reglas que no se negocian

### 2.1. No lees ni ejecutas `tests/`

**El directorio `tests/` no es tuyo.** Lo escribe QA, en paralelo, desde los mismos contratos que tú — sin ver tu implementación, igual que tú no ves sus tests.

Concretamente, y sin excepciones:

- ❌ No abres ningún archivo bajo `tests/`.
- ❌ No ejecutas `npm test`, `vitest`, ni ningún comando que corra la suite.
- ❌ No pides al Lead que te muestre un test, un fixture, un valor esperado ni una traza de aserción.
- ❌ No infieres el contenido de un test a partir del nombre de un archivo.

Tu validación local es:

```bash
npm run build             # tipos
npm run lint              # estilo
npm run check:invariants  # las invariantes de acceso a datos
```

Los tres pasan sin tocar `tests/`. Si los tres están verdes, entregas.

> **Por qué.** Tú y QA escribís desde el mismo contrato, de forma independiente. Ese es el único
> mecanismo que hace que la suite verde *signifique* algo: dos derivaciones independientes del mismo
> contrato que coinciden. Si lees el test, dejas de implementar el contrato y empiezas a implementar
> el test — y entonces la suite ya no prueba que el contrato se cumple, solo que copiaste bien.
> El resultado se ve verde exactamente igual, y ahí está el problema: **es el fallo que nadie
> detecta después.**
>
> Técnicamente puedes abrir `tests/`. Nada del sistema te lo impide. Es una regla, y el valor
> completo del loop depende de que la cumplas cuando sería más cómodo no hacerlo — típicamente
> en la segunda o tercera iteración de un fallo que no acabas de entender. **Ese es justo el
> momento en el que importa.** Si estás ahí, la salida correcta es §4, no `cat tests/`.

### 2.2. No escribes SQL

**No conoces la base de datos.** No hay esquema, DDL ni tablas documentadas en este repo, y es deliberado ([HANDOFF §4, decisión 3](../HANDOFF.md)).

Todas las queries las provee Ángel en [QUERIES.md](../QUERIES.md). Tú:

1. Copias la query **literalmente** a `*.queries.ts`, sin cambiar un carácter.
2. La ejecutas con parámetros posicionales (`?`).
3. Mapeas las filas al DTO del contrato.

Y nada más. En particular:

- ❌ No inventas SQL "provisional" para desbloquearte.
- ❌ No adaptas queries del backend legacy `bacl`.
- ❌ No propones un esquema ni deduces nombres de columnas.
- ❌ No modificas una query aprobada — ni un filtro, ni un `JOIN`, ni un `ORDER BY`. Eso es una *Solicitud de Query* nueva, no una edición.
- ❌ No reimplementas en el service reglas de negocio que la query ya aplica.

**Si necesitas datos sin query aprobada: detienes la tarea** y emites una *Solicitud de Query* con el formato de [QUERIES §3](../QUERIES.md). No dejas un stub para "avanzar mientras tanto".

> **Por qué.** Una query inventada contra un esquema que no conoces falla en runtime — o peor,
> devuelve datos incorrectos en silencio, o rompe el aislamiento entre agencias. Ninguno de los tres
> lo detecta un test escrito contra tu propia suposición.

### 2.3. `id_agente` viene del contexto, siempre

`req.context.id_agente` — inyectado por el middleware desde el header `x-id-agente`. Es un **UUID string**, no un entero.

- ❌ Nunca de `req.body`, `req.query` ni `req.params`.
- ✅ Siempre es el primer parámetro que pasas a las queries del catálogo.

Leerlo de cualquier otro sitio permite a un cliente consultar datos de otra agencia. `npm run check:invariants` falla si lo intentas.

---

## 3. Cómo interpretas el feedback del Lead

Cuando un test falla, el Lead te devuelve una **instrucción de negocio**: qué request se envió, qué respondió tu código, y qué debería haber respondido en lenguaje de negocio. Nunca el test.

Eso es intencional y es suficiente. Ante *"`POST /reservas/filtrar` con `temporalidad: 'proximas'` devuelve reservas cuyo check-in ya pasó"*, la respuesta correcta es revisar cómo aplicas el filtro de temporalidad — no preguntar qué valor exacto esperaba la aserción.

**No pidas el detalle del test.** Si de verdad no puedes avanzar con lo que tienes, eso es §4.

---

## 4. Cuándo paras

Paras y devuelves al Lead, en lugar de improvisar, si:

- Necesitas datos para los que no hay query aprobada → *Solicitud de Query* ([QUERIES §3](../QUERIES.md)).
- Una query aprobada no devuelve un campo que el contrato exige → *Solicitud de Query*, no un cálculo inventado en el service.
- El contrato es ambiguo o se contradice con la tarea → lo reportas citando ambas fuentes.
- Es la tercera vez que te devuelven el mismo fallo → lo dices. El tope de 3 iteraciones existe porque tres fallos sobre lo mismo casi siempre significan contrato ambiguo, no implementación torpe ([ORCHESTRATION_LOOP §2.2](../ORCHESTRATION_LOOP.md)).

Parar con una pregunta concreta es un resultado correcto. Entregar algo plausible que nadie pidió, no.

---

## 5. Checklist antes de entregar

- [ ] `npm run build` sin errores. Cero `any`.
- [ ] `npm run lint` limpio.
- [ ] `npm run check:invariants` en verde.
- [ ] Todo el SQL de `*.queries.ts` es copia literal del catálogo.
- [ ] Todos los parámetros son posicionales (`?`). Cero interpolación de strings, incluido `LIMIT`.
- [ ] `id_agente` sale de `req.context` en todos los repositorios.
- [ ] Las respuestas cumplen la forma de [API_CONTRACT §1](../API_CONTRACT.md), errores incluidos.
- [ ] No abriste `tests/` ni ejecutaste la suite.
