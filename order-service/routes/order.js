const express = require("express")
const CustomerOrder = require("../models/customerOrder")
const axios = require("axios")

const router = express.Router()

const CATALOG_SERVICE_URI =
  process.env.CATALOG_SERVICE_URI ||
  process.env.PRODUCT_SERVICE_URI ||
  "http://catalog-service:5001"

// Helper function to fetch product from catalog service
async function getCatalogProduct(productId) {
  try {
    const res = await axios.get(`${CATALOG_SERVICE_URI}/api/v1/products/${productId}`)
    return res.data
  } catch (err) {
    try {
      const fallbackRes = await axios.get(`${CATALOG_SERVICE_URI}/api/products/${productId}`)
      return fallbackRes.data
    } catch {
      return null
    }
  }
}

// Helper function to deduct product stock
async function deductCatalogStock(productId, quantity) {
  try {
    await axios.put(`${CATALOG_SERVICE_URI}/api/v1/products/${productId}/deduct`, { quantity })
  } catch (err) {
    try {
      await axios.put(`${CATALOG_SERVICE_URI}/api/products/${productId}/deduct`, { quantity })
    } catch (fallbackErr) {
      console.warn(`Stock deduction fallback warning for product ${productId}:`, fallbackErr.message)
    }
  }
}

// Place a new customer order (Supports POST /checkout/:userId and POST /:userId)
const handleCreateOrder = async (req, res) => {
  const { userId } = req.params
  const { items, totalAmount } = req.body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ msg: "Order must contain at least one item" })
  }

  try {
    // Validate inventory availability across all requested items
    const inventoryChecks = await Promise.all(
      items.map(async (item) => {
        const productData = await getCatalogProduct(item.productId)
        return productData && productData.stock >= item.quantity
      })
    )

    if (inventoryChecks.includes(false)) {
      return res.status(400).json({ msg: "One or more items are out of stock" })
    }

    // Persist customer order
    const orderRecord = new CustomerOrder({
      userId,
      items,
      totalAmount,
      status: "Pending",
    })

    await orderRecord.save()

    // Deduct stock in catalog service
    await Promise.all(
      items.map(async (item) => {
        await deductCatalogStock(item.productId, item.quantity)
      })
    )

    res.status(201).json(orderRecord)
  } catch (err) {
    res.status(500).json({ error: "Failed to place order", details: err.message })
  }
}

router.post("/checkout/:userId", handleCreateOrder)
router.post("/:userId", handleCreateOrder)

// Get all orders (admin/listing)
router.get("/", async (req, res) => {
  try {
    const orders = await CustomerOrder.find().sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders", details: err.message })
  }
})

// Get all orders for a specific user
const handleGetUserOrders = async (req, res) => {
  const { userId } = req.params
  try {
    const userOrders = await CustomerOrder.find({ userId }).sort({ createdAt: -1 })
    res.json(userOrders)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user orders", details: err.message })
  }
}

router.get("/user/:userId", handleGetUserOrders)
router.get("/:userId", handleGetUserOrders)

// Get single order by orderId
router.get("/detail/:orderId", async (req, res) => {
  try {
    const orderRecord = await CustomerOrder.findById(req.params.orderId)
    if (!orderRecord) return res.status(404).json({ msg: "Order not found" })
    res.json(orderRecord)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order", details: err.message })
  }
})

// Get order by userId and orderId
router.get("/:userId/:orderId", async (req, res) => {
  const { userId, orderId } = req.params
  try {
    const orderRecord = await CustomerOrder.findOne({ userId, _id: orderId })
    if (!orderRecord) return res.status(404).json({ msg: "Order not found" })
    res.json(orderRecord)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order", details: err.message })
  }
})

// Update order status (PUT /:orderId/status or PATCH /:orderId/status)
const handleUpdateStatus = async (req, res) => {
  const { orderId } = req.params
  const { status } = req.body

  try {
    const orderRecord = await CustomerOrder.findById(orderId)
    if (!orderRecord) return res.status(404).json({ msg: "Order not found" })

    orderRecord.status = status
    await orderRecord.save()

    res.json(orderRecord)
  } catch (err) {
    res.status(500).json({ error: "Failed to update order status", details: err.message })
  }
}

router.put("/:orderId/status", handleUpdateStatus)
router.patch("/:orderId/status", handleUpdateStatus)

module.exports = router
