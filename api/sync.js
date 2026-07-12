import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Set CORS headers for compatibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight options request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
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

      // Store in Vercel KV
      await kv.set('mess_bill_data', payload);
      
      return res.status(200).json({
        status: 'success',
        message: 'Saved successfully'
      });
    }

    if (req.method === 'GET') {
      const data = await kv.get('mess_bill_data');
      
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
    console.error('Vercel KV Sync error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal Server Error'
    });
  }
}
