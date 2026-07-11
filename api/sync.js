import Redis from 'ioredis';

let redis;
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL);
}

export default async function handler(req, res) {
  // Set CORS headers for browser queries
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight options request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!redis) {
    return res.status(500).json({
      status: 'error',
      message: 'Missing REDIS_URL environment variable.'
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

      // Store in Redis as a JSON string
      await redis.set('mess_bill_data', JSON.stringify(payload));
      
      return res.status(200).json({
        status: 'success',
        message: 'Application state synchronized successfully.'
      });
    }

    if (req.method === 'GET') {
      const rawData = await redis.get('mess_bill_data');
      
      // Handle missing data states gracefully (e.g. empty database)
      if (!rawData) {
        return res.status(200).json([]);
      }
      
      const data = JSON.parse(rawData);
      return res.status(200).json(data);
    }

    // Method not allowed
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    return res.status(405).json({
      status: 'error',
      message: `Method ${req.method} not allowed.`
    });

  } catch (error) {
    console.error('Redis Sync error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal Server Error'
    });
  }
}
