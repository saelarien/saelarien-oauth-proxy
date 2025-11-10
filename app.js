require('dotenv').config({ silent: true })
const express = require('express')
const middleWarez = require('./index.js')

const HOST = '0.0.0.0'
const PORT = process.env.PORT || 10000

const app = express()

// Optional: quick health check so you can test the service is up
app.get('/health', (_req, res) => res.send('ok'))

// OAuth routes
app.get('/auth', middleWarez.auth)
app.get('/callback', middleWarez.callback)
app.get('/success', middleWarez.success)
app.get('/', middleWarez.index)

app.listen(PORT, HOST, () => {
  console.log(`OAuth proxy listening on http://${HOST}:${PORT}`)
})