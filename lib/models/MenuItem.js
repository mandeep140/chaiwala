import mongoose from 'mongoose'

const MenuItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    defaultRate: { type: Number, required: true, default: 5 },
    isDefault: { type: Boolean, default: false }, // pre-selected in add modal
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.models.MenuItem ||
  mongoose.model('MenuItem', MenuItemSchema)
