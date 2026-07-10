import swaggerJSDoc from 'swagger-jsdoc';

// OpenAPI 3.0 spec definition — UI served at /api/docs
const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sugity Production Planning API',
      version: '1.0.0',
      description: 'REST API untuk sistem production planning & shopfloor execution PT. Sugity Creatives.',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Development' }],
    components: {
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'sugity_session' },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  // Scans all route files for @swagger JSDoc comments
  apis: ['./src/modules/**/*.routes.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
