const randomstring = require('randomstring');

module.exports = (oauth2) => {
  // Build the authorization URL
  const authorizationUri = oauth2.authorizeURL({
    // IMPORTANT: key name is redirect_uri, not redirectURI
    redirect_uri: process.env.REDIRECT_URL,
    scope: process.env.SCOPES || 'repo,user',
    state: randomstring.generate(32),
  });

  return (_req, res) => {
    res.redirect(authorizationUri);
  };
};