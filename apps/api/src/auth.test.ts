import { describe, it, expect, beforeAll } from 'vitest';
import { Hono } from 'hono';
import { createHonoApp } from '@adapters/http-hono/index.js';

describe('Authentication Endpoints', () => {
  let app: Hono;

  beforeAll(async () => {
    // Note: This would require a test database setup
    // For now, we'll test the endpoint structure
    app = createHonoApp({
      container: null as any,
      logger: console as any,
      loginUseCase: null as any,
      registerUserUseCase: null as any,
      validateSessionUseCase: null as any,
      logoutUseCase: null as any,
    });
  });

  it('should have health check endpoint', async () => {
    const response = await app.request('/health');
    expect(response.status).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('status', 'healthy');
    expect(body).toHaveProperty('timestamp');
  });

  it('should return 400 for invalid registration data', async () => {
    const invalidData = {
      email: 'invalid-email',
      password: '123', // too short
      firstName: '',
      lastName: '',
    };

    const response = await app.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  it('should return 400 for invalid login data', async () => {
    const invalidData = {
      email: 'invalid-email',
      password: '',
    };

    const response = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  it('should return 401 for invalid session token', async () => {
    const response = await app.request('/auth/me', {
      headers: { 'Authorization': 'Bearer invalid-token' },
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  // Note: Full integration tests would require:
  // - Test database setup
  // - Mock dependencies or real implementations
  // - Proper test data seeding and cleanup
});
