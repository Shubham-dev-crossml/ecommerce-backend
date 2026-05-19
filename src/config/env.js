require('dotenv').config()
const { z } = require('zod')

const envSchema = z.object({
  PORT:                    z.string().default('5000'),
  NODE_ENV:                z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL:            z.string(),
  JWT_ACCESS_SECRET:       z.string().min(10),
  JWT_REFRESH_SECRET:      z.string().min(10),
  JWT_ACCESS_EXPIRES:      z.string().default('15m'),
  JWT_REFRESH_EXPIRES:     z.string().default('7d'),
  SMTP_HOST:               z.string(),
  SMTP_PORT:               z.string().default('2525'),
  SMTP_USER:               z.string(),
  SMTP_PASS:               z.string(),
  SMTP_FROM:               z.string(),
  CLIENT_URL:              z.string().default('http://localhost:3000'),
  RAZORPAY_KEY_ID:         z.string().optional(),
  RAZORPAY_KEY_SECRET:     z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

module.exports = parsed.data