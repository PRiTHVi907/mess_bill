export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'OPTIONS']);
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
    const response = await fetch(scriptUrl, {
      method: 'GET',
      redirect: 'follow'
    });

    const payload = await response.json();
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.rows)
        ? payload.rows
        : Array.isArray(payload.records)
          ? payload.records
          : [];

    return res.status(200).json({ status: 'success', rows });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}
