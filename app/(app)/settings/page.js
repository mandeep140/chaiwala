'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

// Add/Edit Menu Item Modal
function MenuItemModal({ open, onClose, item, onSuccess }) {
  const isEdit = !!item
  const [name, setName] = useState('')
  const [rate, setRate] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName(item?.name || '')
      setRate(item?.defaultRate?.toString() || '')
      setIsDefault(item?.isDefault || false)
      setError('')
    }
  }, [open, item])

  async function handleSave() {
    if (!name.trim() || !rate) {
      setError('Name and rate are required')
      return
    }
    setLoading(true)
    setError('')

    try {
      const url = isEdit ? `/api/menu/${item._id}` : '/api/menu'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          defaultRate: parseFloat(rate),
          isDefault,
          isActive: true,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to save')
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
          <DialogTitle className="text-base">
            {isEdit ? 'Edit Item' : 'Add Menu Item'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="item-name">Name *</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chai, Coffee"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="item-rate">Default rate (Rs)</Label>
            <Input
              id="item-rate"
              type="number"
              min={0}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="5"
              className="h-10"
            />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-sm">Set as default selection</span>
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [menuItems, setMenuItems] = useState([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [menuModalOpen, setMenuModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const fetchMenu = useCallback(async () => {
    setMenuLoading(true)
    const res = await fetch('/api/menu')
    const data = await res.json()
    setMenuItems(data)
    setMenuLoading(false)
  }, [])

  useEffect(() => {
    fetchMenu()
  }, [fetchMenu])

  async function handleDeleteItem(id) {
    if (!confirm('Remove this item?')) return
    await fetch(`/api/menu/${id}`, { method: 'DELETE' })
    fetchMenu()
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-border/60 px-4 pt-4 pb-3">
        <h1 className="text-lg font-bold">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">

        {/* Menu Management */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold">Menu Items</h2>
              <p className="text-xs text-muted-foreground">Manage chai, coffee, and other items</p>
            </div>
            <Button
              size="sm"
              className="h-8 text-xs px-3"
              onClick={() => {
                setEditingItem(null)
                setMenuModalOpen(true)
              }}
            >
              + Add
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-border/60 shadow-sm divide-y divide-border/40">
            {menuLoading ? (
              <div className="px-4 py-6 text-center text-muted-foreground text-sm">Loading...</div>
            ) : menuItems.length === 0 ? (
              <div className="px-4 py-6 text-center text-muted-foreground text-sm">No items yet</div>
            ) : (
              menuItems.map((item) => (
                <div key={item._id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{item.name}</p>
                      {item.isDefault && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">Default</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Rs {item.defaultRate}/unit</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-2"
                      onClick={() => {
                        setEditingItem(item)
                        setMenuModalOpen(true)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/5"
                      onClick={() => handleDeleteItem(item._id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <Separator />

        {/* Account */}
        <section>
          <h2 className="text-sm font-semibold mb-3">Account</h2>
          <div className="bg-white rounded-xl border border-border/60 shadow-sm">
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Admin</p>
                <p className="text-xs text-muted-foreground">Logged in</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </section>

        {/* App info */}
        <section>
          <div className="bg-white rounded-xl border border-border/60 shadow-sm divide-y divide-border/40">
            <div className="px-4 py-3 flex justify-between">
              <p className="text-sm text-muted-foreground">App</p>
              <p className="text-sm font-medium">Chaiwala</p>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="text-sm font-medium">1.0.1</p>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <p className="text-sm text-muted-foreground">Patch Name</p>
              <p className="text-sm font-medium">Kadak Chai</p>
            </div>
          </div>
        </section>

        {/* setting footer */}
        <div className="p-4 bg-white border rounded-xl border-border/60 shadow-sm">
          <div className="text-center text-muted-foreground text-sm">
            <p>Made with ❤️ for free forever by</p>
            <p className="font-medium">Deep Productions</p>
          </div>
        </div>
      </div>

      {/* Menu modal */}
      <MenuItemModal
        open={menuModalOpen}
        item={editingItem}
        onClose={() => setMenuModalOpen(false)}
        onSuccess={fetchMenu}
      />
    </div>
  )
}
