import connectDB from '@/lib/db'
import User from '@/lib/models/User'
import { hashPassword } from '@/lib/auth'
import { NextResponse } from 'next/server'

// PATCH /api/admin/users/[id] — update seller (name, phone, isActive, reset password)
export async function PATCH(request, ctx) {
  await connectDB()
  const { id } = await ctx.params
  const body = await request.json()
  const { name, phone, isActive, password } = body

  const update = {}
  if (name !== undefined) update.name = name
  if (phone !== undefined) update.phone = phone
  if (isActive !== undefined) update.isActive = isActive
  if (password) update.passwordHash = hashPassword(password)

  const user = await User.findByIdAndUpdate(id, update, { new: true }).select('-passwordHash')
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(user)
}

// DELETE /api/admin/users/[id] — permanently delete seller account
export async function DELETE(request, ctx) {
  await connectDB()
  const { id } = await ctx.params
  const user = await User.findByIdAndDelete(id)
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
