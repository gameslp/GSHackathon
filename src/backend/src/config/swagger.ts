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
        UserProfile: {
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
            name: {
              type: 'string',
              nullable: true,
              description: 'User first name',
            },
            surname: {
              type: 'string',
              nullable: true,
              description: 'User last name',
            },
            email: {
              type: 'string',
              format: 'email',
              nullable: true,
              description: 'User email address',
            },
            totpConfirmed: {
              type: 'boolean',
              description: 'Whether user has confirmed TOTP setup',
            },
            profileFillPercentage: {
              type: 'integer',
              minimum: 0,
              maximum: 100,
              description: 'Percentage of profile fields filled (name, surname, email)',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp',
            },
          },
        },
        UserWithDetails: {
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
            totpConfirmed: {
              type: 'boolean',
              description: 'Whether user has confirmed TOTP setup',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp',
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
        TeamDetails: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Team ID',
            },
            name: {
              type: 'string',
              description: 'Team name',
            },
            invitationCode: {
              type: 'string',
              pattern: '^[0-9]{6}$',
              description: '6-digit invitation code',
            },
            captainId: {
              type: 'integer',
              description: 'Team captain user ID',
            },
            hackathon: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                },
                title: {
                  type: 'string',
                },
                teamMax: {
                  type: 'integer',
                },
                teamMin: {
                  type: 'integer',
                },
              },
            },
            members: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                  },
                  username: {
                    type: 'string',
                  },
                  name: {
                    type: 'string',
                    nullable: true,
                  },
                  surname: {
                    type: 'string',
                    nullable: true,
                  },
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        TeamSummary: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
            },
            name: {
              type: 'string',
            },
            invitationCode: {
              type: 'string',
            },
            captainId: {
              type: 'integer',
            },
            isAccepted: {
              type: 'boolean',
              description: 'Whether team is accepted by admin',
            },
            memberCount: {
              type: 'integer',
              description: 'Number of members in team',
            },
            members: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        TeamWithSurvey: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
            },
            name: {
              type: 'string',
            },
            invitationCode: {
              type: 'string',
            },
            captainId: {
              type: 'integer',
            },
            isAccepted: {
              type: 'boolean',
            },
            hackathon: {
              type: 'object',
            },
            memberResponses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  member: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                      },
                      username: {
                        type: 'string',
                      },
                      name: {
                        type: 'string',
                        nullable: true,
                      },
                      surname: {
                        type: 'string',
                        nullable: true,
                      },
                      email: {
                        type: 'string',
                        nullable: true,
                      },
                    },
                  },
                  surveyResponses: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        questionId: {
                          type: 'integer',
                        },
                        question: {
                          type: 'string',
                        },
                        answer: {
                          type: 'string',
                        },
                        order: {
                          type: 'integer',
                        },
                      },
                    },
                  },
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Hackathon: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Hackathon ID',
            },
            title: {
              type: 'string',
              description: 'Hackathon title',
            },
            description: {
              type: 'string',
              description: 'Hackathon description',
            },
            rules: {
              type: 'string',
              description: 'Hackathon rules',
            },
            type: {
              type: 'string',
              enum: ['CLASSIFICATION', 'REGRESSION', 'NLP', 'COMPUTER_VISION', 'TIME_SERIES', 'OTHER'],
              description: 'Hackathon type',
            },
            prize: {
              type: 'integer',
              minimum: 0,
              description: 'Prize amount in dollars',
            },
            organizerId: {
              type: 'integer',
              description: 'Organizer user ID',
            },
            teamMax: {
              type: 'integer',
              description: 'Maximum team size',
            },
            teamMin: {
              type: 'integer',
              description: 'Minimum team size',
            },
            registrationOpen: {
              type: 'string',
              format: 'date-time',
              description: 'Registration open date',
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              description: 'Hackathon start date',
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              description: 'Hackathon end date',
            },
            organizer: {
              type: 'object',
              description: 'Hackathon organizer user',
            },
            teams: {
              type: 'array',
              items: {
                type: 'object',
              },
              description: 'Teams participating in hackathon',
            },
            resources: {
              type: 'array',
              items: {
                type: 'object',
              },
              description: 'Hackathon resources',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
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
        name: 'Admin',
        description: 'Admin-only user management endpoints',
      },
      {
        name: 'Teams',
        description: 'Hackathon team management endpoints',
      },
      {
        name: 'Hackathon Management',
        description: 'Admin-only hackathon and team management',
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
