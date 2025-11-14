const randomstring = require('randomstring')

module.exports = (oauth2) => {
  // Build authorization URL
  const authorizationUri = oauth2.authorizeURL({
    redirect_uri: process.env.REDIRECT_URL,   // <-- this is the KEY fix
    scope: process.env.SCOPES || 'repo,user',
    state: randomstring.generate(32)
  })

  return (req, res) => {
    res.redirect(authorizationUri)
  }
}