const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors()); // Allows your website to request data from this server

// In-memory cache to respect the 15-minute rate limit
let cache = {
  data: null,
  timestamp: 0
};

app.get('/api/leaderboard', async (req, res) => {
  const { start_at, end_at } = req.query;
  const apiKey = process.env.ROULOBETS_API_KEY; // Pulled safely from environment variables

  if (!apiKey) {
    return res.status(500).json({ error: 'API key is missing on backend server.' });
  }

  const now = Date.now();
  // 15 minutes = 900,000 ms
  if (cache.data && (now - cache.timestamp < 900000)) {
    return res.json({ ...cache.data, cached: true });
  }

  try {
    const url = `https://api.roulobets.com/v1/external/affiliates?start_at=${start_at}&end_at=${end_at}&key=${encodeURIComponent(apiKey)}&weighted=true`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    
    // Store in backend cache
    cache = {
      data,
      timestamp: now
    };

    res.json({ ...data, cached: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leaderboard data.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
