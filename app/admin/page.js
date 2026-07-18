'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import AddSellerModal from '@/components/AddSellerModal'

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, isRs = true }) {
  return (
    <div className="bg-white rounded-xl border border-border/60 px-4 py-3 shadow-sm">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-xl font-bold">
        {isRs ? `Rs ${typeof value === 'number' ? value.toFixed(0) : 0}` : value}
      </p>
    </div>
  )
}

// ── Platform Analytics Panel ────────────────────────────────────────────────
function PlatformAnalytics({ period }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/analytics?period=${period}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [period])

  if (loading) return <div className="py-8 text-center text-muted-foreground text-sm">Loading...</div>
  if (!data) return null

  const { summary, sellers } = data

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Sales" value={summary.totalSales} />
        <StatCard label="Collected" value={summary.totalCollected} />
        <StatCard label="Platform Udhari" value={summary.totalUdhari} />
        <StatCard label="Total Discount" value={summary.totalDiscount} />
      </div>

      {/* Per-seller table */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Seller Breakdown</h3>
        <div className="bg-white rounded-xl border border-border/60 shadow-sm divide-y divide-border/40">
          {sellers.length === 0 ? (
            <div className="px-4 py-6 text-center text-muted-foreground text-sm">No sellers yet</div>
          ) : (
            sellers.map((seller) => (
              <div key={seller._id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">{seller.name}</p>
                  <Badge
                    variant={seller.isActive ? 'secondary' : 'outline'}
                    className="text-xs h-5"
                  >
                    {seller.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span>Sales</span>
                    <p className="font-semibold text-foreground">Rs {seller.sales.toFixed(0)}</p>
                  </div>
                  <div>
                    <span>Collected</span>
                    <p className="font-semibold text-foreground">Rs {seller.collected.toFixed(0)}</p>
                  </div>
                  <div>
                    <span>Udhari</span>
                    <p className={`font-semibold ${seller.udhari > 0 ? 'text-destructive' : 'text-green-600'}`}>
                      Rs {seller.udhari.toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sellers List ────────────────────────────────────────────────────────────
function SellersList({ sellers, onToggle, onDelete, loading }) {
  if (loading) return <div className="py-8 text-center text-muted-foreground text-sm">Loading...</div>

  if (sellers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border/60 shadow-sm px-4 py-8 text-center text-muted-foreground text-sm">
        No sellers yet. Add your first seller.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-border/60 shadow-sm divide-y divide-border/40">
      {sellers.map((seller) => (
        <div key={seller._id} className="px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">{seller.name}</p>
                <Badge
                  variant={seller.isActive ? 'secondary' : 'outline'}
                  className="text-xs h-4 px-1.5 shrink-0"
                >
                  {seller.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">@{seller.username}</p>
              {seller.phone && (
                <p className="text-xs text-muted-foreground">{seller.phone}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                Joined {new Date(seller.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <Button
                size="sm"
                variant={seller.isActive ? 'outline' : 'default'}
                className="h-7 text-xs px-2"
                onClick={() => onToggle(seller._id, !seller.isActive)}
              >
                {seller.isActive ? 'Deactivate' : 'Activate'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/5"
                onClick={() => onDelete(seller._id, seller.name)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main Admin Page ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter()
  const [sellers, setSellers] = useState([])
  const [sellersLoading, setSellersLoading] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('sellers')

  const fetchSellers = useCallback(async () => {
    setSellersLoading(true)
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setSellers(data)
    setSellersLoading(false)
  }, [])

  useEffect(() => {
    fetchSellers()
  }, [fetchSellers])

  async function handleToggle(id, isActive) {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    })
    fetchSellers()
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete seller "${name}"? This cannot be undone.`)) return
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    fetchSellers()
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const activeSellers = sellers.filter((s) => s.isActive).length
  const totalSellers = sellers.length

  return (
    <div className="max-w-md mx-auto flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-border/60 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
                  <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                </svg>
              </div>
              <h1 className="text-lg font-bold">Chaiwala Admin</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeSellers} active / {totalSellers} total sellers
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/5"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 px-4 pt-3 pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full h-9 mb-4">
            <TabsTrigger value="sellers" className="flex-1 text-xs">Sellers</TabsTrigger>
            <TabsTrigger value="today" className="flex-1 text-xs">Today</TabsTrigger>
            <TabsTrigger value="month" className="flex-1 text-xs">This Month</TabsTrigger>
          </TabsList>

          <TabsContent value="sellers">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">All Sellers</p>
              <Button
                size="sm"
                className="h-8 text-xs px-3"
                onClick={() => setAddModalOpen(true)}
              >
                + Add Seller
              </Button>
            </div>
            <SellersList
              sellers={sellers}
              onToggle={handleToggle}
              onDelete={handleDelete}
              loading={sellersLoading}
            />
          </TabsContent>

          <TabsContent value="today">
            <PlatformAnalytics period="today" />
          </TabsContent>

          <TabsContent value="month">
            <PlatformAnalytics period="month" />
          </TabsContent>
        </Tabs>
      </div>

      <AddSellerModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={fetchSellers}
      />
    </div>
  )
}
