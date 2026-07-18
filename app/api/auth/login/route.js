import { setSession, verifyPassword } from '@/lib/auth'
import connectDB from '@/lib/db'
import User from '@/lib/models/User'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }

    // --- Path 1: Super Admin (from env) ---
    const superAdminUsername = process.env.SUPER_ADMIN_USERNAME || 'superadmin'
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'platform123'

    if (username === superAdminUsername && password === superAdminPassword) {
      await setSession({
        authenticated: true,
        role: 'superadmin',
        userId: null,
        username: superAdminUsername,
      })
      return NextResponse.json({ success: true, role: 'superadmin' })
    }

    // --- Path 2: Tea Seller (from DB) ---
    await connectDB()
    const user = await User.findOne({ username: username.toLowerCase().trim() })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Contact the platform admin.' },
        { status: 403 }
      )
    }

    const valid = verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    await setSession({
      authenticated: true,
      role: 'seller',
      userId: user._id.toString(),
      username: user.username,
      name: user.name,
    })

    return NextResponse.json({ success: true, role: 'seller' })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
