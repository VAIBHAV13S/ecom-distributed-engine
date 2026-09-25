const express = require("express")
const PaymentTransaction = require("../models/paymentTransaction")

const router = express.Router()

// Lazy-initialize stripe or fallback if key is not configured in local dev
let stripe = null
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
}

// Process charge transaction (Supports POST /charge/:orderId and POST /:orderId)
const handleProcessPayment = async (req, res) => {
  const { orderId } = req.params
  const { amount, paymentMethodId, currency = "INR" } = req.body

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Invalid payment amount specified" })
  }

  try {
    let chargeStatus = "succeeded"
    let transactionRef = `mock_tx_${Date.now()}`

    if (stripe && paymentMethodId) {
      const stripeChargeIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe uses cents/smallest currency unit
        currency: currency.toLowerCase(),
        payment_method: paymentMethodId,
        confirm: true,
      })
      chargeStatus = stripeChargeIntent.status
      transactionRef = stripeChargeIntent.id
    }

    const paymentTxRecord = new PaymentTransaction({
      orderId,
      amount,
      currency,
      status: chargeStatus,
      paymentMethod: "stripe",
      transactionReference: transactionRef,
    })

    await paymentTxRecord.save()

    res.status(201).json({
      message: "Payment processed successfully",
      transaction: paymentTxRecord,
    })
  } catch (err) {
    res.status(500).json({
      error: "Payment processing failed",
      details: err.message,
    })
  }
}

router.post("/charge/:orderId", handleProcessPayment)
router.post("/:orderId", handleProcessPayment)

// List all payment transactions (admin/audit)
router.get("/", async (req, res) => {
  try {
    const transactions = await PaymentTransaction.find().sort({ paymentDate: -1 })
    res.json(transactions)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transactions", details: err.message })
  }
})

// Get payment transaction by ID (Supports /transaction/:transactionId and /:paymentId)
const handleGetTransactionById = async (req, res) => {
  const transactionId = req.params.transactionId || req.params.paymentId
  try {
    const paymentTxRecord = await PaymentTransaction.findById(transactionId)
    if (!paymentTxRecord) {
      return res.status(404).json({ msg: "Payment transaction not found" })
    }
    res.json(paymentTxRecord)
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve transaction", details: err.message })
  }
}

router.get("/transaction/:transactionId", handleGetTransactionById)
router.get("/:paymentId", handleGetTransactionById)

// Get all payment transactions for an order
router.get("/order/:orderId", async (req, res) => {
  const { orderId } = req.params
  try {
    const orderTransactions = await PaymentTransaction.find({ orderId }).sort({ paymentDate: -1 })
    res.json(orderTransactions)
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve order payments", details: err.message })
  }
})

module.exports = router
