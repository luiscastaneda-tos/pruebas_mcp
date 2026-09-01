import type { Express } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const healthBody = {
  success: true,
  message: 'Servicio disponible.',
  data: {
    status: 'ok',
  },
};

interface HealthResponse {
  status: number;
  headers: Record<string, unknown>;
  body: unknown;
}

async function loadApp(): Promise<Express> {
  const appModule = (await import('../src/app.js')) as Record<string, unknown>;
  const app = appModule.default ?? appModule.app;

  expect(app).toBeDefined();

  return app as Express;
}

function expectHealthContract(response: HealthResponse): void {
  expect(response.status).toBe(200);
  expect(response.headers['content-type']).toMatch(/^application\/json\b/i);
  expect(response.headers).not.toHaveProperty('x-powered-by');
  expect(response.body).toEqual(healthBody);
}

describe('GET /health', () => {
  it('es público y responde exactamente el contrato de disponibilidad', async () => {
    const app = await loadApp();
    const response = await request(app).get('/health');

    expectHealthContract(response);
  });

  it('conserva su respuesta ante un body JSON malformado', async () => {
    const app = await loadApp();
    const response = await request(app)
      .get('/health')
      .set('Content-Type', 'application/json')
      .send('{"payload":');

    expectHealthContract(response);
  });

  it('conserva su respuesta ante un body JSON sobredimensionado', async () => {
    const app = await loadApp();
    const oversizedBody = JSON.stringify({
      payload: 'x'.repeat(1024 * 1024),
    });
    const response = await request(app)
      .get('/health')
      .set('Content-Type', 'application/json')
      .send(oversizedBody);

    expectHealthContract(response);
  });
});
