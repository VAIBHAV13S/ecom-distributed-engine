const mongoose = require("mongoose")

const cartItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1, min: 1 },
  addedAt: { type: Date, default: Date.now },
})

const shoppingCartSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  items: [cartItemSchema],
  updatedAt: { type: Date, default: Date.now },
})

shoppingCartSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.model("ShoppingCart", shoppingCartSchema)
