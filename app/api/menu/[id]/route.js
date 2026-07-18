import connectDB from '@/lib/db'
import MenuItem from '@/lib/models/MenuItem'
import { getSession } from '@/lib/auth'
import { toObjectId } from '@/lib/objectId'
import { NextResponse } from 'next/server'

// PATCH /api/menu/[id] — update menu item (must belong to this seller)
export async function PATCH(request, ctx) {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { id } = await ctx.params
  const body = await request.json()
  const { name, defaultRate, isDefault, isActive } = body

  const userObjId = toObjectId(session.userId)

  if (isDefault) {
    await MenuItem.updateMany({ userId: userObjId }, { $set: { isDefault: false } })
  }

  const item = await MenuItem.findOneAndUpdate(
    { _id: id, userId: userObjId },
    { name, defaultRate, isDefault, isActive },
    { new: true, runValidators: true }
  )

  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

// DELETE /api/menu/[id] — soft delete (must belong to this seller)
export async function DELETE(request, ctx) {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { id } = await ctx.params
  const item = await MenuItem.findOneAndUpdate(
    { _id: id, userId: toObjectId(session.userId) },
    { isActive: false },
    { new: true }
  )
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
