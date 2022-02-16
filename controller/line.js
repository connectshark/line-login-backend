const fetch = require('node-fetch')

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REDIRECT_URL = process.env.REDIRECT_URL

exports.line = async ( req, res ) => {
  const code = req.query.code
  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: REDIRECT_URL,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  })
  const fetch_response = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form
  })

  const json = await fetch_response.json()
  res.json(json)
}