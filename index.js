require('dotenv').config()
const express = require('express')
const app = express()

const line_controller = require('./controller/line')

app.use(express.json())
app.use(function(req, res, next) {
  const allowedOrigins = ['http://localhost:8081', 'https://shopee.nosegates.com']
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin)
  }
  res.header("Access-Control-Allow-Credentials", true)
  res.header('Access-Control-Allow-Methods', 'GET,POST')
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json')
  next()
})

app.get('/', (req, res) => { res.send('Hello World') })
app.get('/auth', line_controller.line)

const port = process.env.PORT || 3000
app.listen(port)