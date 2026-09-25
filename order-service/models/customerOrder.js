const mongoose = require("mongoose")

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, default: 0 },
})

const customerOrderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Pending", "Processing", "Confirmed", "Shipped", "Delivered", "Cancelled"],
    default: "Pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

customerOrderSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.model("CustomerOrder", customerOrderSchema)
