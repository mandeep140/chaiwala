import crypto from 'crypto'
import { cookies } from 'next/headers'

const SECRET = process.env.SESSION_SECRET || 'chaiwala-secret'
const COOKIE_NAME = 'chaiwala_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function sign(value) {
  const hmac = crypto.createHmac('sha256', SECRET)
  hmac.update(value)
  return value + '.' + hmac.digest('hex')
}

function verify(signed) {
  if (!signed) return null
  const lastDot = signed.lastIndexOf('.')
  if (lastDot === -1) return null
  const value = signed.slice(0, lastDot)
  const expected = sign(value)
  if (signed !== expected) return null
  return value
}

export async function setSession(data) {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64')
  const signed = sign(payload)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

export async function getSession() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(COOKIE_NAME)
  if (!cookie) return null
  const payload = verify(cookie.value)
  if (!payload) return null
  try {
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
  } catch {
    return null
  }
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export function hashPassword(password) {
  return crypto.scryptSync(password, SECRET, 32).toString('hex')
}

export function verifyPassword(password, hash) {
  const incoming = crypto.scryptSync(password, SECRET, 32).toString('hex')
  return incoming === hash
}
