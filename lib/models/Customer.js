import mongoose from 'mongoose'

const CustomerMenuPriceSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    menuItemName: { type: String },
    rate: { type: Number, required: true },
  },
  { _id: false }
)

const CustomerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    notes: { type: String, default: '' },
    menuPrices: [CustomerMenuPriceSchema], // custom rates per menu item
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.models.Customer ||
  mongoose.model('Customer', CustomerSchema)
