'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AddCustomerModal({ open, onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [menuItems, setMenuItems] = useState([])
  const [rates, setRates] = useState({}) // { menuItemId: rate }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      fetchMenu()
      setName('')
      setPhone('')
      setRates({})
      setError('')
    }
  }, [open])

  async function fetchMenu() {
    const res = await fetch('/api/menu')
    const items = await res.json()
    setMenuItems(items)
    // Initialize rates with default values
    const defaults = {}
    items.forEach((item) => {
      defaults[item._id] = item.defaultRate
    })
    setRates(defaults)
  }

  async function handleConfirm() {
    if (!name.trim()) {
      setError('Customer name is required')
      return
    }

    setLoading(true)
    setError('')

    const menuPrices = menuItems.map((item) => ({
      menuItemId: item._id,
      menuItemName: item.name,
      rate: parseFloat(rates[item._id]) || item.defaultRate,
    }))

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone, menuPrices }),
      })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to create customer')
        return
      }

      onSuccess?.()
      onClose()
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[90vw] max-w-sm rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Add Customer</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cust-name">Name *</Label>
            <Input
              id="cust-name"
              type="text"
              placeholder="Shop name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cust-phone">Phone <span className="text-xs text-muted-foreground font-normal">optional</span></Label>
            <Input
              id="cust-phone"
              type="tel"
              placeholder="Mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10"
            />
          </div>

          {menuItems.length > 0 && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Custom rates</p>
                <p className="text-xs text-muted-foreground">Set per-item rate for this customer</p>
              </div>
              {menuItems.map((item) => (
                <div key={item._id} className="flex items-center gap-3">
                  <Label className="flex-1 text-sm">{item.name}</Label>
                  <div className="flex items-center gap-1.5 w-28">
                    <span className="text-sm text-muted-foreground">Rs</span>
                    <Input
                      type="number"
                      min={0}
                      value={rates[item._id] ?? item.defaultRate}
                      onChange={(e) =>
                        setRates((prev) => ({
                          ...prev,
                          [item._id]: e.target.value,
                        }))
                      }
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading} className="flex-1">
            {loading ? 'Saving...' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
