import connectDB from '@/lib/db'
import Transaction from '@/lib/models/Transaction'
import Customer from '@/lib/models/Customer'
import { getSession } from '@/lib/auth'
import { toObjectId } from '@/lib/objectId'
import { NextResponse } from 'next/server'

// POST /api/transactions — record a sale or payment
export async function POST(request) {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const body = await request.json()
  const { customerId, type, items, amount, discount, note } = body

  if (!customerId || !type || amount === undefined) {
    return NextResponse.json(
      { error: 'customerId, type, and amount are required' },
      { status: 400 }
    )
  }

  if (!['sale', 'payment'].includes(type)) {
    return NextResponse.json({ error: 'type must be sale or payment' }, { status: 400 })
  }

  // Verify customer belongs to this seller
  const customer = await Customer.findOne({
    _id: customerId,
    userId: toObjectId(session.userId),
  })
  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  const today = new Date().toLocaleDateString('en-CA')

  const tx = await Transaction.create({
    userId: session.userId,
    customerId,
    customerName: customer.name,
    type,
    items: type === 'sale' ? items : [],
    amount: Number(amount),
    discount: type === 'payment' ? Number(discount || 0) : 0,
    note: note || '',
    date: today,
  })

  return NextResponse.json(tx, { status: 201 })
}

// GET /api/transactions?customerId=xxx
export async function GET(request) {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get('customerId')
  const limit = parseInt(searchParams.get('limit') || '50')

  const query = { userId: toObjectId(session.userId) }
  if (customerId) query.customerId = customerId

  const txs = await Transaction.find(query).sort({ createdAt: -1 }).limit(limit)
  return NextResponse.json(txs)
}
