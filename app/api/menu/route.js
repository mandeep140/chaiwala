import connectDB from '@/lib/db'
import MenuItem from '@/lib/models/MenuItem'
import { getSession } from '@/lib/auth'
import { toObjectId } from '@/lib/objectId'
import { NextResponse } from 'next/server'

// GET /api/menu — list active menu items for the logged-in seller
export async function GET() {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const items = await MenuItem.find({ userId: toObjectId(session.userId), isActive: true }).sort({ createdAt: 1 })
  return NextResponse.json(items)
}

// POST /api/menu — create new menu item for the logged-in seller
export async function POST(request) {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const body = await request.json()
  const { name, defaultRate, isDefault } = body

  if (!name || !defaultRate) {
    return NextResponse.json({ error: 'name and defaultRate are required' }, { status: 400 })
  }

  const userObjId = toObjectId(session.userId)

  // If setting as default, unset previous default for this user only
  if (isDefault) {
    await MenuItem.updateMany({ userId: userObjId }, { $set: { isDefault: false } })
  }

  const item = await MenuItem.create({ userId: userObjId, name, defaultRate, isDefault: !!isDefault })
  return NextResponse.json(item, { status: 201 })
}
