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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function AddChaiModal({ open, onClose, customer, onSuccess }) {
  const [menuItems, setMenuItems] = useState([])
  const [selectedItemId, setSelectedItemId] = useState('')
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      fetchMenu()
      setQty(1)
      setError('')
    }
  }, [open])

  async function fetchMenu() {
    const res = await fetch('/api/menu')
    const items = await res.json()
    setMenuItems(items)

    // Set default: customer custom rate first, then global default
    const defaultItem = items.find((i) => i.isDefault) || items[0]
    if (defaultItem) setSelectedItemId(defaultItem._id)
  }

  function getRateForItem(itemId) {
    if (!customer || !itemId) return 0
    const custom = customer.menuPrices?.find(
      (p) => p.menuItemId === itemId || p.menuItemId?.toString() === itemId
    )
    if (custom) return custom.rate
    const menuItem = menuItems.find((m) => m._id === itemId)
    return menuItem?.defaultRate || 0
  }

  const selectedItem = menuItems.find((m) => m._id === selectedItemId)
  const rate = getRateForItem(selectedItemId)
  const total = rate * qty

  async function handleConfirm() {
    if (!selectedItemId || qty < 1) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer._id,
          type: 'sale',
          items: [
            {
              menuItemId: selectedItemId,
              menuItemName: selectedItem?.name,
              qty: Number(qty),
              rate,
              amount: total,
            },
          ],
          amount: total,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to add')
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
      <DialogContent className="w-[90vw] max-w-sm rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-base">Add Sale</DialogTitle>
          <p className="text-sm text-muted-foreground">{customer?.name}</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Item</Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                {menuItems.map((item) => (
                  <SelectItem key={item._id} value={item._id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qty">Quantity</Label>
            <Input
              id="qty"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="h-10"
            />
          </div>

          <div className="rounded-lg bg-muted/50 px-4 py-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rate</span>
              <span>Rs {rate}/cup</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span>Rs {total}</span>
            </div>
          </div>

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
