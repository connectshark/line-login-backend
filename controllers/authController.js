const User = require('../models/User')
const jwt = require('jsonwebtoken')
const fetch = require('node-fetch')


/**
 * @desc Login
 * @route POST /auth
 * @access Public
 */
const login = async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  const foundUser = await User.findOne({ username }).exec()

  if (!foundUser || !foundUser.active) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const match = await bcrypt.compare(password, foundUser.password)

  if (!match) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const accessToken = jwt.sign(
    {
      UserInfo: {
        username: foundUser.username,
        roles: foundUser.roles
      }
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  )

  const refreshToken = jwt.sign(
    { username: foundUser.username },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  )

  res.cookie('jwt', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })

  res.json({ accessToken })
}

/**
 * @desc Login
 * @route POST /auth
 * @access Public
 */
const line = async (req, res) => {
  const { code, state } = req.query
  
  if (!code) {
    return res.redirect(`http://localhost:8080/callback?error=true&message=未正確認證`)
  }

  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: process.env.LINE_REDIRECT_URI,
    client_id: process.env.LINE_CLIENT_ID,
    client_secret: process.env.LINE_CLIENT_SECRET
  })

  const fetch_token = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form
  })
  const { id_token } = await fetch_token.json()

  const fetch_profile = await fetch(`https://api.line.me/oauth2/v2.1/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      id_token,
      client_id: process.env.LINE_CLIENT_ID
    })
  })
  const profile = await fetch_profile.json()
  console.log('profile:', profile)
  res.redirect(`http://localhost:8080/callback?success=true`)
}

/**
 * @desc Refresh
 * @route GET /auth/refresh
 * @access Public - because access token has expired
 */
const refresh = async (req, res) => {
  const cookies = req.cookies

  if (!cookies?.jwt) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const refreshToken = cookies.jwt

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    asyncHandler(async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Forbidden' })
      }

      const foundUser = await User.findOne({ username: decoded.username }).exec()

      if (!foundUser) {
        return res.status(401).json({ message: 'Unauthorized' })
      }

      const accessToken = jwt.sign(
        {
          UserInfo: {
            username: foundUser.username,
            roles: foundUser.roles
          }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
      )

      res.json({ accessToken })
    })
  )
}

/**
 * @desc Logout
 * @route POST /auth/logout
 * @access Public - just to clear cookie if exists
 */
const logout = async (req, res) => {
  const cookies = req.cookies

  if (!cookies?.jwt) {
    return res.status(204)
  }

  res.clearCookie('jwt', {
    httpOnly: true,
    sameSite: 'none',
    secure: true
  })
  
  res.json({ message: 'Cookie cleared' })
}

module.exports = {
  login,
  refresh,
  logout,
  line
}