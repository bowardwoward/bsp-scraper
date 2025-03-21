import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors';
import issuanceRoutes from './route.js';

const app = new Hono()

app.use(
  "/api/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH"],
    credentials: true,
  })
);


app.get('/', (c) => c.json({ status: 'ok', message: 'BSP Issuances API is running' }));

app.route('/api', issuanceRoutes);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
