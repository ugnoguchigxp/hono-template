import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', honoLogger());

// Routes
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.get('/', (c) => {
  return c.json({
    message: 'Welcome to Hono Template API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        logout: 'POST /auth/logout',
        me: 'GET /auth/me',
      },
    },
  });
});

// Start server function
async function startServer() {
  const port = Number(process.env.PORT) || 0; // 0 = random available port

  console.log(`🚀 Starting server on port ${port}`);

  if (typeof Bun !== 'undefined') {
    // Bun environment
    const server = Bun.serve({
      port,
      fetch: app.fetch,
      development: process.env.NODE_ENV === 'development',
    });

    console.log(`✅ Server listening on http://localhost:${server.port}`);
  } else {
    // Node.js environment
    try {
      const { serve } = await import('@hono/node-server');
      serve({
        fetch: app.fetch,
        port,
      });
      console.log(`✅ Server listening on http://localhost:${port}`);
    } catch (error) {
      console.error('❌ Failed to start Node.js server:', error);
      console.log('💡 Install @hono/node-server for Node.js support');
      process.exit(1);
    }
  }
}

// Start the server
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

export default app;
