'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import AddChaiModal from '@/components/AddChaiModal'
import CollectPaymentModal from '@/components/CollectPaymentModal'
import AddCustomerModal from '@/components/AddCustomerModal'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [addChaiCustomer, setAddChaiCustomer] = useState(null)
  const [paymentCustomer, setPaymentCustomer] = useState(null)
  const [showAddCustomer, setShowAddCustomer] = useState(false)

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers')
      const data = await res.json()
      setCustomers(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
    // Seed on first load
    fetch('/api/seed', { method: 'POST' }).catch(() => {})
  }, [fetchCustomers])

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-border/60 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold leading-tight">Customers</h1>
            <p className="text-xs text-muted-foreground">{today}</p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddCustomer(true)}
            className="h-8 text-xs px-3"
          >
            + Add
          </Button>
        </div>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-input bg-muted/30 outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {search ? 'No customers found' : 'No customers yet'}
            </p>
            {!search && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setShowAddCustomer(true)}
              >
                Add first customer
              </Button>
            )}
          </div>
        ) : (
          filtered.map((customer) => (
            <CustomerCard
              key={customer._id}
              customer={customer}
              onAddChai={() => setAddChaiCustomer(customer)}
              onCollect={() => setPaymentCustomer(customer)}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <AddChaiModal
        open={!!addChaiCustomer}
        customer={addChaiCustomer}
        onClose={() => setAddChaiCustomer(null)}
        onSuccess={fetchCustomers}
      />
      <CollectPaymentModal
        open={!!paymentCustomer}
        customer={paymentCustomer}
        onClose={() => setPaymentCustomer(null)}
        onSuccess={fetchCustomers}
      />
      <AddCustomerModal
        open={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onSuccess={fetchCustomers}
      />
    </div>
  )
}

function CustomerCard({ customer, onAddChai, onCollect }) {
  const hasUdhari = customer.udhari > 0
  const todayItems = customer.today?.items || []
  const todayAmount = customer.today?.amount || 0

  return (
    <div className="bg-white rounded-xl border border-border/60 px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        {/* Left: name + today info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">{customer.name}</p>
            {hasUdhari && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0 h-4 shrink-0">
                Udhari
              </Badge>
            )}
          </div>

          {/* Today's summary */}
          {todayItems.length > 0 ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              Today:{' '}
              {todayItems.map((i) => `${i.qty} ${i.name}`).join(', ')} &mdash;{' '}
              <span className="font-medium text-foreground">Rs {todayAmount}</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">No sale today</p>
          )}

          {/* Udhari */}
          <p className="text-sm mt-1">
            <span className="text-muted-foreground text-xs">Udhari: </span>
            <span className={`font-bold text-sm ${hasUdhari ? 'text-destructive' : 'text-green-600'}`}>
              Rs {customer.udhari.toFixed(0)}
            </span>
          </p>
        </div>

        {/* Right: action buttons */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={onAddChai}
            className="h-8 text-xs px-3 border-primary/30 text-primary hover:bg-primary/5"
          >
            + Chai
          </Button>
          <Button
            size="sm"
            onClick={onCollect}
            className="h-8 text-xs px-3"
            variant={hasUdhari ? 'default' : 'secondary'}
          >
            Collect
          </Button>
        </div>
      </div>
    </div>
  )
}
