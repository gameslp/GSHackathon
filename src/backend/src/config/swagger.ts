import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GS Hackathon API',
      version: '1.0.0',
      description: 'API documentation for GS Hackathon backend with TOTP authentication',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'auth_token',
          description: 'JWT token stored in HTTP-only cookie',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID',
            },
            username: {
              type: 'string',
              description: 'Username',
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'JUDGE', 'PARTICIPANT'],
              description: 'User role',
            },
          },
        },
        RegisterStartRequest: {
          type: 'object',
          required: ['username'],
          properties: {
            username: {
              type: 'string',
              description: 'Desired username',
              example: 'johndoe',
            },
          },
        },
        RegisterStartResponse: {
          type: 'object',
          properties: {
            userId: {
              type: 'integer',
              description: 'Created user ID',
            },
            username: {
              type: 'string',
              description: 'Username',
            },
            totpSecret: {
              type: 'string',
              description: 'TOTP secret in base32 format for QR code generation',
            },
          },
        },
        RegisterConfirmRequest: {
          type: 'object',
          required: ['username', 'token'],
          properties: {
            username: {
              type: 'string',
              description: 'Username',
              example: 'johndoe',
            },
            token: {
              type: 'string',
              description: '6-digit TOTP code from Google Authenticator',
              example: '123456',
              pattern: '^[0-9]{6}$',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'token'],
          properties: {
            username: {
              type: 'string',
              description: 'Username',
              example: 'johndoe',
            },
            token: {
              type: 'string',
              description: '6-digit TOTP code from Google Authenticator',
              example: '123456',
              pattern: '^[0-9]{6}$',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Login successful',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        MessageResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'OK',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'TOTP-based authentication endpoints',
      },
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
