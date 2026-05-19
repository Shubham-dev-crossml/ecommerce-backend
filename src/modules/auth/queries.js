const { query, getClient } = require('../../config/db')

// ─── User lookups ──────────────────────────────────────────────

const findUserByEmail = async (email) => {
  const { rows } = await query(
    `SELECT id, name, email, password_hash, role, is_verified, is_active,
            refresh_token, verify_token, reset_token, reset_token_expires
     FROM users
     WHERE email = $1`,
    [email]
  )
  return rows[0] || null
}

const findUserById = async (id) => {
  const { rows } = await query(
    `SELECT id, name, email, role, is_verified, is_active
     FROM users
     WHERE id = $1`,
    [id]
  )
  return rows[0] || null
}

const findUserByVerifyToken = async (token) => {
  const { rows } = await query(
    `SELECT id, is_verified FROM users WHERE verify_token = $1`,
    [token]
  )
  return rows[0] || null
}

const findUserByResetToken = async (token) => {
  const { rows } = await query(
    `SELECT id, reset_token_expires FROM users
     WHERE reset_token = $1
       AND reset_token_expires > NOW()`,
    [token]
  )
  return rows[0] || null
}

// ─── User creation ─────────────────────────────────────────────

const createUser = async ({ name, email, passwordHash, role, verifyToken }) => {
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role, verify_token)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role`,
    [name, email, passwordHash, role, verifyToken]
  )
  return rows[0]
}

// ─── User updates ──────────────────────────────────────────────

const markUserVerified = async (id) => {
  await query(
    `UPDATE users
     SET is_verified = true, verify_token = NULL
     WHERE id = $1`,
    [id]
  )
}

const updateRefreshToken = async (id, refreshToken) => {
  await query(
    `UPDATE users SET refresh_token = $1 WHERE id = $2`,
    [refreshToken, id]
  )
}

const clearRefreshToken = async (id) => {
  await query(
    `UPDATE users SET refresh_token = NULL WHERE id = $1`,
    [id]
  )
}

const setResetToken = async (id, token, expiresAt) => {
  await query(
    `UPDATE users
     SET reset_token = $1, reset_token_expires = $2
     WHERE id = $3`,
    [token, expiresAt, id]
  )
}

const updatePassword = async (id, passwordHash) => {
  await query(
    `UPDATE users
     SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL
     WHERE id = $2`,
    [passwordHash, id]
  )
}

const findUserByRefreshToken = async (refreshToken) => {
  const { rows } = await query(
    `SELECT id, name, email, role, is_verified, is_active, refresh_token
     FROM users
     WHERE refresh_token = $1`,
    [refreshToken]
  )
  return rows[0] || null
}

module.exports = {
  findUserByEmail,
  findUserById,
  findUserByVerifyToken,
  findUserByResetToken,
  findUserByRefreshToken,
  createUser,
  markUserVerified,
  updateRefreshToken,
  clearRefreshToken,
  setResetToken,
  updatePassword,
}