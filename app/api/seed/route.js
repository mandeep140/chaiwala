import connectDB from '@/lib/db'
import MenuItem from '@/lib/models/MenuItem'
import { getSession } from '@/lib/auth'
import { toObjectId } from '@/lib/objectId'
import { NextResponse } from 'next/server'

// POST /api/seed — seed default menu items for the logged-in seller (idempotent)
export async function POST() {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const userObjId = toObjectId(session.userId)
  const count = await MenuItem.countDocuments({ userId: userObjId })

  if (count > 0) {
    return NextResponse.json({ message: 'Already seeded', count })
  }

  await MenuItem.insertMany([
    { userId: userObjId, name: 'Chai', defaultRate: 5, isDefault: true, isActive: true },
    { userId: userObjId, name: 'Coffee', defaultRate: 10, isDefault: false, isActive: true },
  ])

  return NextResponse.json({ message: 'Seeded default menu items' })
}
