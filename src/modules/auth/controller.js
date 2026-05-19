const bcrypt        = require('bcryptjs')
const crypto        = require('crypto')
const { AppError }  = require('../../middleware/errorHandler')
const logger        = require('../../utils/logger')
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../../utils/jwt')
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('../../utils/mailer')
const queries = require('./queries')

// ─── helpers ───────────────────────────────────────────────────

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
}

const issueTokens = async (user, res) => {
  const payload = { id: user.id, role: user.role }
  const accessToken  = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  await queries.updateRefreshToken(user.id, refreshToken)

  res.cookie('refreshToken', refreshToken, COOKIE_OPTS)
  return accessToken
}

// ─── register ──────────────────────────────────────────────────

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.validated.body

    const existing = await queries.findUserByEmail(email)
    if (existing) throw new AppError('Email already in use', 409)

    const passwordHash  = await bcrypt.hash(password, 12)
    const verifyToken   = crypto.randomBytes(32).toString('hex')

    const user = await queries.createUser({ name, email, passwordHash, role, verifyToken })

    await sendVerificationEmail(email, verifyToken)

    logger.info(`New user registered: ${email}`)
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: { id: user.id, name: user.name, email: user.email, role: user.role }
    })
  } catch (err) { next(err) }
}

// ─── verify email ──────────────────────────────────────────────

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query
    if (!token) throw new AppError('Token is required', 400)

    const user = await queries.findUserByVerifyToken(token)
    if (!user)           throw new AppError('Invalid or expired token', 400)
    if (user.is_verified) throw new AppError('Email already verified', 400)

    await queries.markUserVerified(user.id)

    res.json({ success: true, message: 'Email verified. You can now log in.' })
  } catch (err) { next(err) }
}

// ─── login ─────────────────────────────────────────────────────

const login = async (req, res, next) => {
  try {
    const { email, password } = req.validated.body

    const user = await queries.findUserByEmail(email)
    if (!user) throw new AppError('Invalid email or password', 401)

    if (!user.is_active)
      throw new AppError('Your account has been suspended', 403)

    if (!user.is_verified)
      throw new AppError('Please verify your email before logging in', 403)

    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatch) throw new AppError('Invalid email or password', 401)

    const accessToken = await issueTokens(user, res)

    logger.info(`User logged in: ${email}`)
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      }
    })
  } catch (err) { next(err) }
}

// ─── refresh token ─────────────────────────────────────────────

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken
    if (!token) throw new AppError('Refresh token missing', 401)

    // verify signature first
    let payload
    try {
      payload = verifyRefreshToken(token)
    } catch {
      throw new AppError('Invalid or expired refresh token', 401)
    }

    // check token matches what's stored (rotation check)
    const user = await queries.findUserByRefreshToken(token)
    if (!user) throw new AppError('Refresh token reuse detected', 401)

    const accessToken = await issueTokens(user, res)

    res.json({ success: true, data: { accessToken } })
  } catch (err) { next(err) }
}

// ─── logout ────────────────────────────────────────────────────

const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken
    if (token) {
      const user = await queries.findUserByRefreshToken(token)
      if (user) await queries.clearRefreshToken(user.id)
    }

    res.clearCookie('refreshToken', COOKIE_OPTS)
    res.json({ success: true, message: 'Logged out successfully' })
  } catch (err) { next(err) }
}

// ─── forgot password ───────────────────────────────────────────

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.validated.body

    const user = await queries.findUserByEmail(email)

    // always return success — don't reveal if email exists
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' })
    }

    const resetToken  = crypto.randomBytes(32).toString('hex')
    const expiresAt   = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await queries.setResetToken(user.id, resetToken, expiresAt)
    await sendPasswordResetEmail(email, resetToken)

    logger.info(`Password reset requested: ${email}`)
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' })
  } catch (err) { next(err) }
}

// ─── reset password ────────────────────────────────────────────

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.validated.body

    const user = await queries.findUserByResetToken(token)
    if (!user) throw new AppError('Invalid or expired reset token', 400)

    const passwordHash = await bcrypt.hash(password, 12)
    await queries.updatePassword(user.id, passwordHash)

    // invalidate all sessions on password reset
    await queries.clearRefreshToken(user.id)
    res.clearCookie('refreshToken', COOKIE_OPTS)

    logger.info(`Password reset successful for user: ${user.id}`)
    res.json({ success: true, message: 'Password reset successful. Please log in.' })
  } catch (err) { next(err) }
}

// ─── get current user ──────────────────────────────────────────

const getMe = async (req, res, next) => {
  try {
    const user = await queries.findUserById(req.user.id)
    if (!user) throw new AppError('User not found', 404)
    res.json({ success: true, data: user })
  } catch (err) { next(err) }
}

module.exports = {
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
}