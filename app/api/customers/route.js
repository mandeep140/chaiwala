import connectDB from '@/lib/db'
import Customer from '@/lib/models/Customer'
import Transaction from '@/lib/models/Transaction'
import { getSession } from '@/lib/auth'
import { toObjectId } from '@/lib/objectId'
import { NextResponse } from 'next/server'

// GET /api/customers — list all customers for the logged-in seller
export async function GET() {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const userObjId = toObjectId(session.userId)
  const customers = await Customer.find({ userId: userObjId, isActive: true }).sort({ name: 1 })

  const today = new Date().toLocaleDateString('en-CA')
  const customerIds = customers.map((c) => c._id)

  const [balances, todaySales] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId: userObjId, customerId: { $in: customerIds } } },
      {
        $group: {
          _id: '$customerId',
          totalSales: {
            $sum: { $cond: [{ $eq: ['$type', 'sale'] }, '$amount', 0] },
          },
          totalPayments: {
            $sum: {
              $cond: [
                { $eq: ['$type', 'payment'] },
                { $add: ['$amount', { $ifNull: ['$discount', 0] }] },
                0,
              ],
            },
          },
        },
      },
    ]),
    Transaction.aggregate([
      {
        $match: {
          userId: userObjId,
          customerId: { $in: customerIds },
          type: 'sale',
          date: today,
        },
      },
      {
        $group: {
          _id: '$customerId',
          todayAmount: { $sum: '$amount' },
          todayItems: { $push: '$items' },
        },
      },
    ]),
  ])

  const balanceMap = {}
  for (const b of balances) {
    balanceMap[b._id.toString()] = b.totalSales - b.totalPayments
  }

  const todayMap = {}
  for (const t of todaySales) {
    const flat = t.todayItems.flat()
    const summary = {}
    for (const item of flat) {
      const key = item.menuItemName
      if (!summary[key]) summary[key] = { name: key, qty: 0 }
      summary[key].qty += item.qty
    }
    todayMap[t._id.toString()] = {
      amount: t.todayAmount,
      items: Object.values(summary),
    }
  }

  const result = customers.map((c) => ({
    _id: c._id,
    name: c.name,
    phone: c.phone,
    menuPrices: c.menuPrices,
    udhari: balanceMap[c._id.toString()] || 0,
    today: todayMap[c._id.toString()] || { amount: 0, items: [] },
  }))

  return NextResponse.json(result)
}

// POST /api/customers — create new customer for the logged-in seller
export async function POST(request) {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const body = await request.json()
  const { name, phone, notes, menuPrices } = body

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const customer = await Customer.create({
    userId: session.userId,
    name,
    phone,
    notes,
    menuPrices,
  })
  return NextResponse.json(customer, { status: 201 })
}
