const mongoose = require("mongoose")

const paymentTransactionSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, required: true },
  paymentMethod: { type: String, required: true, default: "stripe" },
  transactionReference: { type: String },
  currency: { type: String, default: "INR" },
  paymentDate: { type: Date, default: Date.now },
})

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema)
