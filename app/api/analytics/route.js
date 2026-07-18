import connectDB from '@/lib/db'
import Transaction from '@/lib/models/Transaction'
import { getSession } from '@/lib/auth'
import { toObjectId } from '@/lib/objectId'
import { NextResponse } from 'next/server'

// GET /api/analytics?period=today|month
export async function GET(request) {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'today'

  const now = new Date()
  const today = now.toLocaleDateString('en-CA')
  const userObjId = toObjectId(session.userId)

  let dateFilter = {}
  if (period === 'today') {
    dateFilter = { date: today }
  } else if (period === 'month') {
    const monthPrefix = today.slice(0, 7)
    dateFilter = { date: { $regex: `^${monthPrefix}` } }
  }

  const [salesAgg, paymentsAgg, itemsAgg] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId: userObjId, ...dateFilter, type: 'sale' } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$amount' },
          txCount: { $sum: 1 },
        },
      },
    ]),
    Transaction.aggregate([
      { $match: { userId: userObjId, ...dateFilter, type: 'payment' } },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: '$amount' },
          totalDiscount: { $sum: '$discount' },
        },
      },
    ]),
    Transaction.aggregate([
      { $match: { userId: userObjId, ...dateFilter, type: 'sale' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItemName',
          totalQty: { $sum: '$items.qty' },
          totalAmount: { $sum: '$items.amount' },
        },
      },
      { $sort: { totalQty: -1 } },
    ]),
  ])

  const sales = salesAgg[0] || { totalSales: 0, txCount: 0 }
  const payments = paymentsAgg[0] || { totalCollected: 0, totalDiscount: 0 }

  const totalSales = sales.totalSales
  const totalCollected = payments.totalCollected
  const totalDiscount = payments.totalDiscount
  const udhari = totalSales - totalCollected - totalDiscount

  return NextResponse.json({
    period,
    totalSales,
    totalCollected,
    totalDiscount,
    udhari: Math.max(0, udhari),
    itemBreakdown: itemsAgg.map((i) => ({
      name: i._id,
      qty: i.totalQty,
      amount: i.totalAmount,
    })),
  })
}
