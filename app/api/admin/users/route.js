import connectDB from '@/lib/db'
import User from '@/lib/models/User'
import { hashPassword } from '@/lib/auth'
import { NextResponse } from 'next/server'

// GET /api/admin/users — list all sellers
export async function GET() {
  await connectDB()
  const users = await User.find({}).sort({ createdAt: -1 }).select('-passwordHash')
  return NextResponse.json(users)
}

// POST /api/admin/users — create a new seller account
export async function POST(request) {
  await connectDB()
  const body = await request.json()
  const { username, password, name, phone } = body

  if (!username || !password || !name) {
    return NextResponse.json(
      { error: 'username, password, and name are required' },
      { status: 400 }
    )
  }

  const existing = await User.findOne({ username: username.toLowerCase().trim() })
  if (existing) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
  }

  const passwordHash = hashPassword(password)
  const user = await User.create({
    username: username.toLowerCase().trim(),
    passwordHash,
    name,
    phone,
    isActive: true,
  })

  // Return without passwordHash
  const { passwordHash: _, ...safeUser } = user.toObject()
  return NextResponse.json(safeUser, { status: 201 })
}
