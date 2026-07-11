function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      resolve(body);
    });

    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  const scriptUrl = process.env.SCRIPT_URL;
  if (!scriptUrl) {
    return res.status(500).json({
      status: 'error',
      message: 'Missing SCRIPT_URL environment variable.'
    });
  }

  try {
    const rawBody = typeof req.body === 'string' ? req.body : await readRawBody(req);

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      redirect: 'follow',
      body: rawBody
    });

    const payload = await response.json();

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}
