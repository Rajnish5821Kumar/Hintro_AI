/**
 * Swagger / OpenAPI Documentation Configuration
 * Uses swagger-jsdoc to generate spec from JSDoc comments
 * and swagger-ui-express to serve the interactive UI.
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Meeting Intelligence Service API',
      version: '1.0.0',
      description: `
## Meeting Intelligence Service

Enterprise-grade AI-powered Meeting Intelligence Platform.

### Features
- **JWT Authentication** — Secure register/login
- **Meeting Management** — Full CRUD with pagination, search, and filters
- **AI Analysis** — Gemini 2.5 Flash analysis with grounded citations
- **Action Items** — Create, track, and manage with overdue detection
- **Reminder System** — Automated Telegram notifications via cron
- **Grounded AI** — Every insight is cited; no hallucinations

### Authentication
All protected endpoints require a Bearer token:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`
      `,
      contact: {
        name: 'Rajnish Kumar',
        email: 'rk2452003@gmail.com',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: process.env.DEPLOYED_URL || 'https://your-app.onrender.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token from the /api/auth/login endpoint',
        },
      },
      schemas: {
        // ── Unified Response Schemas ──────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            traceId: { type: 'string', example: 'a1b2c3d4-e5f6-...' },
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            traceId: { type: 'string' },
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Meeting title is required' },
                details: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
        // ── Auth Schemas ──────────────────────────────────────
        RegisterRequest: {
          type: 'object',
          required: ['email', 'name', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'rajnish@example.com' },
            name: { type: 'string', example: 'Rajnish Kumar' },
            password: { type: 'string', minLength: 8, example: 'SecurePass123' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'rajnish@example.com' },
            password: { type: 'string', example: 'SecurePass123' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
            token: { type: 'string' },
            expiresIn: { type: 'string', example: '7d' },
          },
        },
        // ── Meeting Schemas ───────────────────────────────────
        TranscriptEntry: {
          type: 'object',
          required: ['speaker', 'text', 'timestamp'],
          properties: {
            speaker: { type: 'string', example: 'Alice' },
            text: { type: 'string', example: 'We need to finish the release notes by Friday.' },
            timestamp: { type: 'string', example: '00:10' },
            sequence: { type: 'integer', example: 0 },
          },
        },
        CreateMeetingRequest: {
          type: 'object',
          required: ['title', 'participants', 'meetingDate'],
          properties: {
            title: { type: 'string', example: 'Q2 Product Planning' },
            participants: {
              type: 'array',
              items: { type: 'string' },
              example: ['Alice', 'Bob', 'Charlie'],
            },
            meetingDate: {
              type: 'string',
              format: 'date-time',
              example: '2026-06-10T10:00:00.000Z',
            },
            transcripts: {
              type: 'array',
              items: { $ref: '#/components/schemas/TranscriptEntry' },
            },
          },
        },
        Meeting: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            participants: { type: 'array', items: { type: 'string' } },
            meetingDate: { type: 'string', format: 'date-time' },
            createdById: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            transcripts: {
              type: 'array',
              items: { $ref: '#/components/schemas/TranscriptEntry' },
            },
          },
        },
        // ── Analysis Schemas ──────────────────────────────────
        Citation: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '00:10' },
            speaker: { type: 'string', example: 'Alice' },
            quote: { type: 'string', example: 'We need to launch next Friday.' },
          },
        },
        GroundedItem: {
          type: 'object',
          properties: {
            text: { type: 'string', example: 'Team agreed to launch next Friday.' },
            citations: {
              type: 'array',
              items: { $ref: '#/components/schemas/Citation' },
            },
          },
        },
        Analysis: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            meetingId: { type: 'string' },
            summary: {
              type: 'array',
              items: { $ref: '#/components/schemas/GroundedItem' },
            },
            actionItems: { type: 'array', items: { type: 'object' } },
            decisions: {
              type: 'array',
              items: { $ref: '#/components/schemas/GroundedItem' },
            },
            followUpSuggestions: {
              type: 'array',
              items: { $ref: '#/components/schemas/GroundedItem' },
            },
            modelUsed: { type: 'string', example: 'gemini-2.5-flash' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Action Item Schemas ───────────────────────────────
        ActionItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            task: { type: 'string', example: 'Prepare Release Notes' },
            assignee: { type: 'string', example: 'Alice' },
            dueDate: { type: 'string', format: 'date-time' },
            status: {
              type: 'string',
              enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
            },
            meetingId: { type: 'string' },
            reminderCount: { type: 'integer', example: 2 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateActionItemRequest: {
          type: 'object',
          required: ['task', 'assignee', 'dueDate', 'meetingId'],
          properties: {
            task: { type: 'string', example: 'Prepare Release Notes' },
            assignee: { type: 'string', example: 'Alice' },
            dueDate: {
              type: 'string',
              format: 'date-time',
              example: '2026-06-15T17:00:00.000Z',
            },
            meetingId: { type: 'string' },
            telegramChatId: { type: 'string' },
          },
        },
        UpdateStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
              example: 'IN_PROGRESS',
            },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'Register and login endpoints' },
      { name: 'Meetings', description: 'Meeting management' },
      { name: 'AI Analysis', description: 'Gemini AI transcript analysis' },
      { name: 'Action Items', description: 'Action item tracking' },
      { name: 'System', description: 'Health check and evaluation' },
    ],
  },
  apis: [path.join(__dirname, '../routes/*.ts'), path.join(__dirname, '../routes/*.js')],
};

export const swaggerSpec = swaggerJsdoc(options);

/**
 * Mount Swagger UI on the Express app at /docs.
 */
export const setupSwagger = (app: Express): void => {
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: `
        .swagger-ui .topbar { background-color: #1a1a2e; }
        .swagger-ui .topbar-wrapper img { content: url(''); }
      `,
      customSiteTitle: 'Meeting Intelligence API',
    })
  );

  // Also expose the raw JSON spec
  app.get('/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
