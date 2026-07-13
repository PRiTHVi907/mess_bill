import { kv } from '@vercel/kv';
import Redis from 'ioredis';

let dbClient = null;

if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
  // Use Vercel KV if environment variables are present
  dbClient = {
    get: async (key) => kv.get(key),
    set: async (key, val) => kv.set(key, val)
  };
} else if (process.env.REDIS_URL) {
  // Fall back to standard Redis if REDIS_URL is present
  const redisClient = new Redis(process.env.REDIS_URL);
  dbClient = {
    get: async (key) => {
      const raw = await redisClient.get(key);
      return raw ? JSON.parse(raw) : null;
    },
    set: async (key, val) => {
      return redisClient.set(key, JSON.stringify(val));
    }
  };
}

export default async function handler(req, res) {
  // Set CORS headers for compatibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight options request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!dbClient) {
    return res.status(500).json({
      status: 'error',
      message: 'Database connection configuration missing. Please set either REDIS_URL or KV_REST_API_URL/KV_REST_API_TOKEN environment variables.'
    });
  }

  try {
    if (req.method === 'POST') {
      let payload = req.body;
      
      // Parse string payload if sent as raw text/plain or string body
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch (e) {
          return res.status(400).json({
            status: 'error',
            message: 'Failed to parse JSON body payload'
          });
        }
      }

      // Store in DB
      await dbClient.set('mess_bill_data', payload);
      
      return res.status(200).json({
        status: 'success',
        message: 'Saved successfully'
      });
    }

    if (req.method === 'GET') {
      const data = await dbClient.get('mess_bill_data');
      
      // Handle missing data states gracefully
      if (!data) {
        return res.status(200).json([]);
      }
      
      return res.status(200).json(data);
    }

    // Method not allowed
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    return res.status(405).json({
      status: 'error',
      message: `Method ${req.method} not allowed.`
    });

  } catch (error) {
    console.error('Database Sync error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal Server Error'
    });
  }
}
