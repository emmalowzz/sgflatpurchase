import http from 'http';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATA_GOV_SG_ENDPOINT = 'https://data.gov.sg/api/action/datastore_search?resource_id=d_8b84c4ee58e3cfc0ece0d773c8ca6abc';

app.use(express.json());

// In-memory cache for fast snappy responses
const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Helper function to check data.gov.sg API health
async function checkApiHealth() {
  const startTime = Date.now();
  try {
    const url = `${DATA_GOV_SG_ENDPOINT}&limit=1&sort=month%20desc`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Singapore-Flat-Price-Explorer/1.0'
      }
    });

    const latencyMs = Date.now() - startTime;
    if (!response.ok) {
      return {
        status: 'DOWN',
        healthy: false,
        latencyMs,
        statusCode: response.status,
        statusText: response.statusText,
        error: `Upstream HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      };
    }

    const payload = await response.json();
    const isSuccess = payload && payload.success === true;
    const totalRecords = payload?.result?.total ?? 0;
    const sampleRecord = payload?.result?.records?.[0] ?? null;

    return {
      status: isSuccess ? 'UP' : 'DEGRADED',
      healthy: isSuccess,
      latencyMs,
      statusCode: response.status,
      timestamp: new Date().toISOString(),
      upstream: {
        endpoint: DATA_GOV_SG_ENDPOINT,
        success: isSuccess,
        totalRecords,
        sampleRecord,
        fields: payload?.result?.fields?.map((f: any) => f.id) ?? []
      },
      server: {
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      }
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      status: 'DOWN',
      healthy: false,
      latencyMs,
      statusCode: 500,
      error: err?.message || 'Unknown network error',
      timestamp: new Date().toISOString()
    };
  }
}

// Explicit route requested by user: /api/health/js
app.get('/api/health/js', async (_req, res) => {
  const healthData = await checkApiHealth();
  const statusCode = healthData.healthy ? 200 : 503;
  res.status(statusCode).json({
    service: 'singapore-flat-price-explorer-health-monitor',
    format: 'application/json',
    ...healthData
  });
});

// Standard route alias: /api/health
app.get('/api/health', async (_req, res) => {
  const healthData = await checkApiHealth();
  const statusCode = healthData.healthy ? 200 : 503;
  res.status(statusCode).json(healthData);
});

// Query proxy for flat resale data with filters, caching and sort
app.get('/api/flats', async (req, res) => {
  try {
    const town = typeof req.query.town === 'string' ? req.query.town.trim() : '';
    const flatType = typeof req.query.flat_type === 'string' ? req.query.flat_type.trim() : '';
    const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 500, 1), 2000);
    const offset = Math.max(parseInt(req.query.offset as string, 10) || 0, 0);
    const sort = typeof req.query.sort === 'string' ? req.query.sort : 'month desc';

    // Build filters object
    const filters: Record<string, string> = {};
    if (town && town !== 'ALL') {
      filters.town = town.toUpperCase();
    }
    if (flatType && flatType !== 'ALL') {
      filters.flat_type = flatType.toUpperCase();
    }

    const cacheKey = JSON.stringify({ filters, limit, offset, sort });
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json({ ...cached.data, cached: true });
    }

    // Construct request URL
    const url = new URL(DATA_GOV_SG_ENDPOINT);
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('offset', offset.toString());
    url.searchParams.set('sort', sort);
    if (Object.keys(filters).length > 0) {
      url.searchParams.set('filters', JSON.stringify(filters));
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Singapore-Flat-Price-Explorer/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Data.gov.sg returned HTTP ${response.status}`);
    }

    const data = await response.json();

    cache.set(cacheKey, { timestamp: Date.now(), data });
    return res.json(data);
  } catch (err: any) {
    console.error('Error in /api/flats:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to fetch flat data'
    });
  }
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';
  const httpServer = http.createServer(app);

  if (isDev) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve dist folder
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Singapore Flat Price Explorer server listening on port ${PORT}`);
  });
}

startServer();
