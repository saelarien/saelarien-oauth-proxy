// index.js - tiny GitHub OAuth proxy for Decap/Netlify CMS

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// Read from Render environment variables
const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const ORIGINS = (process.env.ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const REDIRECT_URL =
  process.env.REDIRECT_URL ||
  'https://saelarien-oauth-proxy.onrender.com/callback';

// simple health check
app.get('/', (req, res) => {
  res.send('OAuth proxy is running 🌿');
});

// /auth -> redirect to GitHub OAuth
app.get('/auth', (req, res) => {
  const provider = req.query.provider;
  if (provider !== 'github') {
    return res.status(400).send('Unsupported provider');
  }

  const scope = req.query.scope || 'repo';
  const state = Math.random().toString(36).slice(2);

  const authorizeUrl = `https://github.com/login/oauth/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URL)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${state}`;

  res.redirect(authorizeUrl);
});

// GitHub callback -> exchange code for token and send it back to CMS
app.get('/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('Missing "code" param');
  }

  try {
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URL,
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenRes.data.access_token;

    if (!accessToken) {
      console.error('No access token in response:', tokenRes.data);
      return res.status(500).send('No access token received');
    }

    // This HTML is what Decap/Netlify CMS expects from an OAuth proxy
    const html = `
<!doctype html>
<html>
  <body>
    <script>
      (function() {
        function receiveMessage(e) {
          // basic origin check if you want to enforce allowed origins
          var allowed = ${JSON.stringify(ORIGINS)};
          if (allowed.length && allowed.indexOf(e.origin) === -1) {
            console.log('Blocked origin', e.origin);
            return;
          }
          window.opener.postMessage(
            'authorization:github:success:${accessToken}',
            e.origin
          );
          window.close();
        }
        window.addEventListener('message', receiveMessage, false);
        // Tell the opener we're ready
        window.opener.postMessage('authorizing:github', '*');
      })();
    </script>
    <p>You can close this window.</p>
  </body>
</html>
    `;
    res.send(html);
  } catch (err) {
    console.error('OAuth error:', err.response?.data || err.message);
    res.status(500).send('OAuth error');
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log('OAuth proxy listening on port', PORT);
});