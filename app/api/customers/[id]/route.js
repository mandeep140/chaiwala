import connectDB from '@/lib/db'
import Customer from '@/lib/models/Customer'
import { getSession } from '@/lib/auth'
import { toObjectId } from '@/lib/objectId'
import { NextResponse } from 'next/server'

async function getCustomerForUser(id, userId) {
  const customer = await Customer.findOne({ _id: id, userId: toObjectId(userId) })
  return customer
}

// GET /api/customers/[id]
export async function GET(request, ctx) {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { id } = await ctx.params
  const customer = await getCustomerForUser(id, session.userId)
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(customer)
}

// PATCH /api/customers/[id]
export async function PATCH(request, ctx) {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { id } = await ctx.params
  const body = await request.json()

  const customer = await Customer.findOneAndUpdate(
    { _id: id, userId: toObjectId(session.userId) },
    body,
    { new: true, runValidators: true }
  )
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(customer)
}

// DELETE /api/customers/[id] — soft delete
export async function DELETE(request, ctx) {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { id } = await ctx.params
  const customer = await Customer.findOneAndUpdate(
    { _id: id, userId: toObjectId(session.userId) },
    { isActive: false },
    { new: true }
  )
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
