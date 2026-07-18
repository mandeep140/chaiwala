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

export default function CollectPaymentModal({
  open,
  onClose,
  customer,
  onSuccess,
}) {
  const [amount, setAmount] = useState('')
  const [discount, setDiscount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setAmount('')
      setDiscount('')
      setNote('')
      setError('')
    }
  }, [open])

  const udhari = customer?.udhari || 0
  const amountNum = parseFloat(amount) || 0
  const discountNum = parseFloat(discount) || 0
  const remaining = Math.max(0, udhari - amountNum - discountNum)

  async function handleConfirm() {
    if (!amountNum && !discountNum) {
      setError('Enter amount or discount')
      return
    }
    if (amountNum < 0 || discountNum < 0) {
      setError('Values must be positive')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer._id,
          type: 'payment',
          amount: amountNum,
          discount: discountNum,
          note,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to record payment')
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
          <DialogTitle className="text-base">Collect Payment</DialogTitle>
          <p className="text-sm text-muted-foreground">{customer?.name}</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current balance */}
          <div className="rounded-lg bg-muted/50 px-4 py-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total udhari</span>
              <span className="font-semibold text-destructive">Rs {udhari.toFixed(0)}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount received (Rs)</Label>
            <Input
              id="amount"
              type="number"
              min={0}
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="discount">
              Discount / Maafi (Rs)
              <span className="ml-1 text-xs text-muted-foreground font-normal">optional</span>
            </Label>
            <Input
              id="discount"
              type="number"
              min={0}
              placeholder="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Note <span className="text-xs text-muted-foreground font-normal">optional</span></Label>
            <Input
              id="note"
              type="text"
              placeholder="e.g. Partial payment"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-10"
            />
          </div>

          {(amountNum > 0 || discountNum > 0) && (
            <div className="rounded-lg bg-muted/50 px-4 py-3 space-y-1">
              {discountNum > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount given</span>
                  <span>- Rs {discountNum.toFixed(0)}</span>
                </div>
              )}
              {amountNum > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Collected</span>
                  <span>- Rs {amountNum.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold border-t border-border/50 pt-1 mt-1">
                <span>Remaining udhari</span>
                <span className={remaining > 0 ? 'text-destructive' : 'text-green-600'}>
                  Rs {remaining.toFixed(0)}
                </span>
              </div>
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
            {loading ? 'Saving...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
