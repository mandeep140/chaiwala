'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`rounded-xl border bg-white px-4 py-3 shadow-sm ${accent ? 'border-' + accent + '/30' : 'border-border/60'}`}>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-xl font-bold ${accent === 'destructive' ? 'text-destructive' : accent === 'green' ? 'text-green-600' : ''}`}>
        Rs {typeof value === 'number' ? value.toFixed(0) : 0}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

function AnalyticsPanel({ period }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics?period=${period}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [period])

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        Loading...
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4 px-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total Sales"
          value={data.totalSales}
          sub="Billed amount"
        />
        <StatCard
          label="Collected"
          value={data.totalCollected}
          sub="Cash received"
          accent="green"
        />
        <StatCard
          label="Udhari"
          value={data.udhari}
          sub="Pending collection"
          accent="destructive"
        />
        <StatCard
          label="Discount"
          value={data.totalDiscount}
          sub="Maafi given"
        />
      </div>

      {/* Item breakdown */}
      <div>
        <h2 className="text-sm font-semibold mb-2">Item Breakdown</h2>
        {data.itemBreakdown.length === 0 ? (
          <div className="bg-white rounded-xl border border-border/60 px-4 py-6 text-center text-muted-foreground text-sm shadow-sm">
            No sales recorded
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border/60 shadow-sm divide-y divide-border/40">
            {data.itemBreakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.qty} units</p>
                </div>
                <p className="text-sm font-semibold">Rs {item.amount.toFixed(0)}</p>
              </div>
            ))}
            {/* Total row */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
              <p className="text-sm font-semibold">Total</p>
              <p className="text-sm font-bold">Rs {data.totalSales.toFixed(0)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-border/60 px-4 pt-4 pb-3">
        <h1 className="text-lg font-bold">Analytics</h1>
        <p className="text-xs text-muted-foreground">Sales and collection summary</p>
      </div>

      <Tabs defaultValue="today" className="flex-1">
        <div className="px-4 pt-3">
          <TabsList className="w-full h-9">
            <TabsTrigger value="today" className="flex-1 text-xs">Today</TabsTrigger>
            <TabsTrigger value="month" className="flex-1 text-xs">This Month</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="today" className="mt-3">
          <AnalyticsPanel period="today" />
        </TabsContent>
        <TabsContent value="month" className="mt-3">
          <AnalyticsPanel period="month" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
