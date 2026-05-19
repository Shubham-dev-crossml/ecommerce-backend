const nodemailer = require('nodemailer')
const env        = require('../config/env')
const logger     = require('./logger')

const createTransporter = () =>
  nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    }
  })

const sendMail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter()
    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html
    })
    logger.info(`Email sent to ${to}: ${info.messageId}`)
    return info
  } catch (err) {
    logger.error(`Email failed to ${to}: ${err.message}`)
    throw err
  }
}

const sendVerificationEmail = (to, token) =>
  sendMail({
    to,
    subject: 'Verify your email',
    html: `
      <h2>Welcome!</h2>
      <p>Click below to verify your email:</p>
      <a href="${env.CLIENT_URL}/verify-email?token=${token}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `
  })

const sendPasswordResetEmail = (to, token) =>
  sendMail({
    to,
    subject: 'Reset your password',
    html: `
      <h2>Password Reset</h2>
      <p>Click below to reset your password:</p>
      <a href="${env.CLIENT_URL}/reset-password?token=${token}">Reset Password</a>
      <p>Expires in 1 hour. Ignore if you didn't request this.</p>
    `
  })

module.exports = { sendVerificationEmail, sendPasswordResetEmail }