const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'CampusFlow REST API',
    version: '1.0.0',
    description:
      'Enterprise API documentation for CampusFlow — Smart Campus Resource Booking and Management System. Provides secure endpoints for multi-role resource discovery, race-safe slot reservation, approvals, maintenance management, and audit logging.',
    contact: {
      name: 'CampusFlow Architecture Team',
      email: 'support@campusflow.edu',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Default Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your short-lived access JWT token.',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'System health and MongoDB readiness probe',
        tags: ['Health'],
        responses: {
          200: { description: 'System healthy and database connected' },
          503: { description: 'Database disconnected or degraded' },
        },
      },
    },
    '/auth/signup': {
      post: {
        summary: 'Register new student or faculty account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'confirmPassword', 'department'],
                properties: {
                  name: { type: 'string', example: 'Jane Doe' },
                  email: { type: 'string', example: 'jane.doe@campusflow.edu' },
                  password: { type: 'string', example: 'SecurePass@123' },
                  confirmPassword: { type: 'string', example: 'SecurePass@123' },
                  department: { type: 'string', example: 'Computer Science' },
                  role: { type: 'string', enum: ['student', 'faculty'], default: 'student' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Account registered successfully with access token' },
          400: { description: 'Validation failed' },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate existing user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'jane.doe@campusflow.edu' },
                  password: { type: 'string', example: 'SecurePass@123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Rotate refresh token and issue new access token',
        tags: ['Authentication'],
        responses: {
          200: { description: 'Session refreshed' },
          401: { description: 'Invalid or expired session cookie' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current user profile',
        tags: ['Authentication'],
        responses: {
          200: { description: 'Current user session profile' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/resources': {
      get: {
        summary: 'List campus resources with filters and pagination',
        tags: ['Resources'],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'type', in: 'query', schema: { type: 'string' } },
          { name: 'minCapacity', in: 'query', schema: { type: 'integer' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
        ],
        responses: {
          200: { description: 'List of resources with pagination' },
        },
      },
      post: {
        summary: 'Create resource (Admin only)',
        tags: ['Resources'],
        responses: {
          201: { description: 'Resource created' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/resources/{id}/availability': {
      get: {
        summary: 'Check real-time slot availability for a resource on a specific date',
        tags: ['Resources'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'date', in: 'query', required: true, schema: { type: 'string', example: '2026-10-25' } },
        ],
        responses: {
          200: { description: 'Real-time slot availability map' },
        },
      },
    },
    '/bookings': {
      post: {
        summary: 'Submit a new booking request with race-safe slot reservation',
        tags: ['Bookings'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['resource', 'date', 'startTime', 'endTime', 'purpose'],
                properties: {
                  resource: { type: 'string' },
                  date: { type: 'string', example: '2026-10-25' },
                  startTime: { type: 'string', example: '09:00' },
                  endTime: { type: 'string', example: '11:00' },
                  purpose: { type: 'string', example: 'AI & Data Science Workshop' },
                  expectedAttendees: { type: 'integer', default: 1 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Booking created and discrete slots reserved' },
          409: { description: 'Conflict: Slot already booked' },
        },
      },
    },
    '/bookings/my': {
      get: {
        summary: 'Get current user personal bookings',
        tags: ['Bookings'],
        responses: {
          200: { description: 'Personal bookings list' },
        },
      },
    },
    '/bookings/admin/queue': {
      get: {
        summary: 'Pending bookings approval queue (Admin only)',
        tags: ['Bookings'],
        responses: {
          200: { description: 'Pending queue with conflict indicators' },
        },
      },
    },
    '/bookings/{id}/approve': {
      patch: {
        summary: 'Approve pending booking request (Admin only)',
        tags: ['Bookings'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Booking approved and confirmed' },
        },
      },
    },
    '/bookings/{id}/reject': {
      patch: {
        summary: 'Reject pending booking request with reason (Admin only)',
        tags: ['Bookings'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Booking rejected and slots released' },
        },
      },
    },
    '/analytics/dashboard': {
      get: {
        summary: 'Get executive analytics and utilization statistics (Admin only)',
        tags: ['Analytics'],
        responses: {
          200: { description: 'Aggregated analytics and chart data' },
        },
      },
    },
    '/analytics/export/bookings': {
      get: {
        summary: 'Download bookings CSV report (Admin only)',
        tags: ['Analytics'],
        responses: {
          200: { description: 'CSV file download' },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
