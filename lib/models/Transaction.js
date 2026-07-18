import mongoose from 'mongoose'

const SaleItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    menuItemName: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true }, // qty * rate
  },
  { _id: false }
)

const TransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    customerName: { type: String }, // denormalized for quick access
    type: {
      type: String,
      enum: ['sale', 'payment'],
      required: true,
    },
    // For sales: list of items
    items: [SaleItemSchema],
    // For payments: amount received and discount given
    amount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    note: { type: String, default: '' },
    date: { type: String, required: true }, // YYYY-MM-DD
  },
  { timestamps: true }
)

TransactionSchema.index({ userId: 1, customerId: 1, date: 1 })
TransactionSchema.index({ userId: 1, date: 1, type: 1 })

export default mongoose.models.Transaction ||
  mongoose.model('Transaction', TransactionSchema)
