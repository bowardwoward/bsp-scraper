import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import issuanceRoutes from './route.js';

const app = new Hono()

app.get('/', (c) => c.json({ status: 'ok', message: 'BSP Issuances API is running' }));

app.route('/api', issuanceRoutes);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
