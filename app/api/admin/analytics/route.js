import connectDB from '@/lib/db'
import User from '@/lib/models/User'
import Transaction from '@/lib/models/Transaction'
import { NextResponse } from 'next/server'

// GET /api/admin/analytics?period=today|month
export async function GET(request) {
  await connectDB()

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'today'

  const now = new Date()
  const today = now.toLocaleDateString('en-CA')

  let dateFilter = {}
  if (period === 'today') {
    dateFilter = { date: today }
  } else if (period === 'month') {
    const monthPrefix = today.slice(0, 7)
    dateFilter = { date: { $regex: `^${monthPrefix}` } }
  }

  const [users, platformSales, platformPayments, perSellerStats] = await Promise.all([
    // All users
    User.find({}).select('_id name username isActive createdAt'),

    // Platform-wide sales
    Transaction.aggregate([
      { $match: { ...dateFilter, type: 'sale' } },
      { $group: { _id: null, totalSales: { $sum: '$amount' } } },
    ]),

    // Platform-wide payments
    Transaction.aggregate([
      { $match: { ...dateFilter, type: 'payment' } },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: '$amount' },
          totalDiscount: { $sum: '$discount' },
        },
      },
    ]),

    // Per-seller breakdown
    Transaction.aggregate([
      { $match: { ...dateFilter } },
      {
        $group: {
          _id: { userId: '$userId', type: '$type' },
          total: { $sum: '$amount' },
          discount: { $sum: { $ifNull: ['$discount', 0] } },
        },
      },
    ]),
  ])

  // Build per-seller map
  const sellerMap = {}
  for (const u of users) {
    sellerMap[u._id.toString()] = {
      _id: u._id,
      name: u.name,
      username: u.username,
      isActive: u.isActive,
      createdAt: u.createdAt,
      sales: 0,
      collected: 0,
      discount: 0,
      udhari: 0,
    }
  }

  for (const row of perSellerStats) {
    const uid = row._id.userId?.toString()
    if (!uid || !sellerMap[uid]) continue
    if (row._id.type === 'sale') {
      sellerMap[uid].sales += row.total
    } else if (row._id.type === 'payment') {
      sellerMap[uid].collected += row.total
      sellerMap[uid].discount += row.discount
    }
  }

  // Calculate udhari per seller
  for (const uid in sellerMap) {
    const s = sellerMap[uid]
    s.udhari = Math.max(0, s.sales - s.collected - s.discount)
  }

  const totalSales = platformSales[0]?.totalSales || 0
  const totalCollected = platformPayments[0]?.totalCollected || 0
  const totalDiscount = platformPayments[0]?.totalDiscount || 0

  return NextResponse.json({
    period,
    summary: {
      totalSellers: users.length,
      activeSellers: users.filter((u) => u.isActive).length,
      inactiveSellers: users.filter((u) => !u.isActive).length,
      totalSales,
      totalCollected,
      totalDiscount,
      totalUdhari: Math.max(0, totalSales - totalCollected - totalDiscount),
    },
    sellers: Object.values(sellerMap),
  })
}
