require('dotenv').config()
const env = require('./config/env')  // validates env first — crashes fast if broken
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const { errorHandler } = require('./middleware/errorHandler')
const cookieParser = require('cookie-parser')

const app = express()

app.use(helmet())
app.use(cors({ origin: env.CLIENT_URL, credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })
app.use(limiter)

app.get('/api/health', async (req, res) => {
  const { query } = require('./config/db')
  try {
    await query('SELECT 1')
    res.json({ status: 'ok', uptime: process.uptime(), env: env.NODE_ENV })
  } catch {
    res.status(503).json({ status: 'db_error' })
  }
})

app.use('/api/auth', require('./modules/auth/router'))

// routes will be added here phase by phase
// app.use('/api/auth', require('./modules/auth/router'))

app.use(errorHandler)

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`)
})