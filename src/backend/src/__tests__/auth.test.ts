import request from 'supertest';
import { createApp } from '../app';
import { PrismaClient } from '../generated/prisma/client';
import { authenticator } from 'otplib';
import { Express } from 'express';

const prisma = new PrismaClient();
let app: Express;

beforeAll(async () => {
  app = createApp();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Authentication Endpoints', () => {
  let testUsername: string;
  let testSecret: string;
  let authCookie: string;

  beforeEach(() => {
    testUsername = `testuser_${Date.now()}`;
  });

  afterEach(async () => {
    // Cleanup: delete test user
    try {
      await prisma.user.deleteMany({
        where: { username: testUsername },
      });
    } catch (error) {
      // Ignore errors if user doesn't exist
    }
  });

  describe('POST /auth/register-start', () => {
    it('should create a new user and return TOTP secret', async () => {
      const response = await request(app)
        .post('/auth/register-start')
        .send({ username: testUsername })
        .expect(201);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('username', testUsername);
      expect(response.body).toHaveProperty('totpSecret');
      expect(typeof response.body.totpSecret).toBe('string');

      testSecret = response.body.totpSecret;
    });

    it('should return 400 if username is missing', async () => {
      const response = await request(app)
        .post('/auth/register-start')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Username is required');
    });

    it('should return 400 if username already exists', async () => {
      // Create user first
      await request(app)
        .post('/auth/register-start')
        .send({ username: testUsername })
        .expect(201);

      // Try to create again
      const response = await request(app)
        .post('/auth/register-start')
        .send({ username: testUsername })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Username already exists');
    });
  });

  describe('POST /auth/register-confirm', () => {
    beforeEach(async () => {
      // Create user and get secret
      const response = await request(app)
        .post('/auth/register-start')
        .send({ username: testUsername });
      testSecret = response.body.totpSecret;
    });

    it('should confirm registration with valid TOTP code', async () => {
      const token = authenticator.generate(testSecret);

      const response = await request(app)
        .post('/auth/register-confirm')
        .send({ username: testUsername, token })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Registration confirmed successfully');
    });

    it('should return 401 with invalid TOTP code', async () => {
      const response = await request(app)
        .post('/auth/register-confirm')
        .send({ username: testUsername, token: '000000' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid TOTP code');
    });

    it('should return 400 if username or token is missing', async () => {
      const response = await request(app)
        .post('/auth/register-confirm')
        .send({ username: testUsername })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Username and token are required');
    });

    it('should return 404 if user does not exist', async () => {
      const token = authenticator.generate(testSecret);

      const response = await request(app)
        .post('/auth/register-confirm')
        .send({ username: 'nonexistentuser', token })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create and confirm user
      const registerResponse = await request(app)
        .post('/auth/register-start')
        .send({ username: testUsername });
      testSecret = registerResponse.body.totpSecret;

      const token = authenticator.generate(testSecret);
      await request(app)
        .post('/auth/register-confirm')
        .send({ username: testUsername, token });
    });

    it('should login with valid credentials and return JWT cookie', async () => {
      const token = authenticator.generate(testSecret);

      const response = await request(app)
        .post('/auth/login')
        .send({ username: testUsername, token })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', testUsername);
      expect(response.body.user).toHaveProperty('role');

      // Check for auth cookie
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('auth_token');

      authCookie = cookies[0];
    });

    it('should return 401 with invalid TOTP code', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ username: testUsername, token: '000000' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return 401 if user does not exist', async () => {
      const token = authenticator.generate(testSecret);

      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'nonexistentuser', token })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return 401 if user is not confirmed', async () => {
      const unconfirmedUsername = `unconfirmed_${Date.now()}`;
      const registerResponse = await request(app)
        .post('/auth/register-start')
        .send({ username: unconfirmedUsername });
      const unconfirmedSecret = registerResponse.body.totpSecret;

      const token = authenticator.generate(unconfirmedSecret);

      const response = await request(app)
        .post('/auth/login')
        .send({ username: unconfirmedUsername, token })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'User registration not confirmed');

      // Cleanup
      await prisma.user.deleteMany({ where: { username: unconfirmedUsername } });
    });

    it('should return 400 if username or token is missing', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ username: testUsername })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Username and token are required');
    });
  });

  describe('GET /auth/me', () => {
    beforeEach(async () => {
      // Create, confirm and login user
      const registerResponse = await request(app)
        .post('/auth/register-start')
        .send({ username: testUsername });
      testSecret = registerResponse.body.totpSecret;

      const confirmToken = authenticator.generate(testSecret);
      await request(app)
        .post('/auth/register-confirm')
        .send({ username: testUsername, token: confirmToken });

      const loginToken = authenticator.generate(testSecret);
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ username: testUsername, token: loginToken });

      authCookie = loginResponse.headers['set-cookie'][0];
    });

    it('should return user data with valid auth cookie', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body).toHaveProperty('username', testUsername);
      expect(response.body).toHaveProperty('role');
      expect(response.body).toHaveProperty('id');
    });

    it('should return 401 without auth cookie', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Not authenticated');
    });

    it('should return 401 with invalid auth cookie', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Cookie', 'auth_token=invalid_token')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid token');
    });
  });

  describe('POST /auth/logout', () => {
    beforeEach(async () => {
      // Create, confirm and login user
      const registerResponse = await request(app)
        .post('/auth/register-start')
        .send({ username: testUsername });
      testSecret = registerResponse.body.totpSecret;

      const confirmToken = authenticator.generate(testSecret);
      await request(app)
        .post('/auth/register-confirm')
        .send({ username: testUsername, token: confirmToken });

      const loginToken = authenticator.generate(testSecret);
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ username: testUsername, token: loginToken });

      authCookie = loginResponse.headers['set-cookie'][0];
    });

    it('should logout and clear auth cookie', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logout successful');

      // Check that cookie is cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('auth_token=;');
    });

    it('should return 401 without auth cookie', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Not authenticated');
    });
  });
});
