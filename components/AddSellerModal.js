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

export default function AddSellerModal({ open, onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setUsername('')
      setPhone('')
      setPassword('')
      setError('')
    }
  }, [open])

  async function handleSave() {
    if (!name.trim() || !username.trim() || !password) {
      setError('Name, username, and password are required')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          phone,
          password,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to create seller')
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
          <DialogTitle className="text-base">Add Seller</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="seller-name">Display Name *</Label>
            <Input
              id="seller-name"
              placeholder="e.g. Ramu Chaiwala"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seller-username">Username *</Label>
            <Input
              id="seller-username"
              placeholder="e.g. ramu123"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className="h-10"
              autoCapitalize="none"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seller-phone">
              Phone <span className="text-xs text-muted-foreground font-normal">optional</span>
            </Label>
            <Input
              id="seller-phone"
              type="tel"
              placeholder="Mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seller-password">Password *</Label>
            <Input
              id="seller-password"
              type="password"
              placeholder="Set a password for this seller"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
