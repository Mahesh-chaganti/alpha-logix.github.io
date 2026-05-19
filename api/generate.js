const axios = require('axios');

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, type } = req.body;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Text generation
    if (type === 'text') {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }
        }
      );
      return res.json(response.data);
    }

    // Image generation
    if (type === 'image') {
      const response = await openai.images.generate({
              model: "gpt-image-1",
              prompt: prompt,
              size: "1024x1024"
        }
        {
          headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }
        }
      );
      return res.json(response.data);
    }

    return res.status(400).json({ error: 'Invalid type' });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: error.response?.data?.error?.message || error.message || 'Generation failed',
      details: error.response?.data
    });
  }
}
