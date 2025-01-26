import express from 'express';
import request from 'supertest';
import { setupAuth } from '../auth';
import { db } from '@db';
import { users } from '@db/schema';

describe('Auth endpoints', () => {
  let app: express.Express;
  let server: any;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    setupAuth(app);
    server = app.listen(0); // Use random port for testing
  });

  afterAll(async () => {
    await db.end();
    server.close();
  });

  beforeEach(async () => {
    // Clean up the test database
    await db.delete(users);
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        username: 'testuser',
        password: 'testpass123'
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Registration successful');
    expect(res.body.user.username).toBe('testuser');
  });

  it('should not register a user with existing username', async () => {
    // First registration
    await request(app)
      .post('/api/register')
      .send({
        username: 'testuser',
        password: 'testpass123'
      });

    // Second registration with same username
    const res = await request(app)
      .post('/api/register')
      .send({
        username: 'testuser',
        password: 'different123'
      });

    expect(res.status).toBe(400);
    expect(res.text).toBe('Username already exists');
  });

  it('should login a user with correct credentials', async () => {
    // Register first
    await request(app)
      .post('/api/register')
      .send({
        username: 'testuser',
        password: 'testpass123'
      });

    // Then login
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'testuser',
        password: 'testpass123'
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Login successful');
  });

  it('should not login with incorrect password', async () => {
    // Register first
    await request(app)
      .post('/api/register')
      .send({
        username: 'testuser',
        password: 'testpass123'
      });

    // Try login with wrong password
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'testuser',
        password: 'wrongpass'
      });

    expect(res.status).toBe(400);
    expect(res.text).toBe('Incorrect password.');
  });
});