const express = require("express")
const ShoppingCart = require("../models/shoppingCart")
const axios = require("axios")

const router = express.Router()

const CATALOG_SERVICE_URI =
  process.env.CATALOG_SERVICE_URI ||
  process.env.PRODUCT_SERVICE_URI ||
  "http://catalog-service:5001"

// Helper function to verify product in catalog service
async function verifyCatalogItem(productId) {
  try {
    const response = await axios.get(
      `${CATALOG_SERVICE_URI}/api/v1/products/${productId}`
    )
    return response.data
  } catch (err) {
    try {
      const fallbackResponse = await axios.get(
        `${CATALOG_SERVICE_URI}/api/products/${productId}`
      )
      return fallbackResponse.data
    } catch {
      return null
    }
  }
}

// Add item to shopping cart (RESTful: POST /:userId/items, with fallback /:userId/add)
const handleAddItem = async (req, res) => {
  const { userId } = req.params
  const { productId, quantity } = req.body
  const itemQty = Number(quantity) || 1

  try {
    const catalogItem = await verifyCatalogItem(productId)
    if (!catalogItem) {
      return res.status(404).json({ msg: "Product item not found in catalog" })
    }

    let activeCart = await ShoppingCart.findOne({ userId })

    if (!activeCart) {
      activeCart = new ShoppingCart({
        userId,
        items: [{ productId, quantity: itemQty }],
      })
    } else {
      const targetIndex = activeCart.items.findIndex(
        (item) => item.productId === productId
      )
      if (targetIndex > -1) {
        activeCart.items[targetIndex].quantity += itemQty
      } else {
        activeCart.items.push({ productId, quantity: itemQty })
      }
    }

    await activeCart.save()
    res.status(201).json(activeCart)
  } catch (err) {
    res.status(500).json({ error: "Failed to add item to cart", details: err.message })
  }
}

router.post("/:userId/items", handleAddItem)
router.post("/:userId/add", handleAddItem)

// Get active cart for user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params
  try {
    const activeCart = await ShoppingCart.findOne({ userId })
    if (!activeCart) {
      return res.status(404).json({ msg: "Cart not found" })
    }
    res.json(activeCart)
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve cart", details: err.message })
  }
})

// Update item quantity in cart (RESTful: PUT/PATCH /:userId/items/:productId, with fallback /:userId/update/:productId)
const handleUpdateItem = async (req, res) => {
  const { userId, productId } = req.params
  const { quantity } = req.body
  const newQty = Number(quantity)

  if (isNaN(newQty) || newQty <= 0) {
    return res.status(400).json({ msg: "Quantity must be a positive number" })
  }

  try {
    const activeCart = await ShoppingCart.findOne({ userId })
    if (!activeCart) {
      return res.status(404).json({ msg: "Cart not found" })
    }

    const itemIndex = activeCart.items.findIndex(
      (item) => item.productId === productId
    )
    if (itemIndex > -1) {
      activeCart.items[itemIndex].quantity = newQty
    } else {
      return res.status(404).json({ msg: "Item not found in cart" })
    }

    await activeCart.save()
    res.json(activeCart)
  } catch (err) {
    res.status(500).json({ error: "Failed to update item quantity", details: err.message })
  }
}

router.put("/:userId/items/:productId", handleUpdateItem)
router.patch("/:userId/items/:productId", handleUpdateItem)
router.put("/:userId/update/:productId", handleUpdateItem)

// Remove item from cart (RESTful: DELETE /:userId/items/:productId, with fallback /:userId/remove/:productId)
const handleRemoveItem = async (req, res) => {
  const { userId, productId } = req.params
  try {
    const activeCart = await ShoppingCart.findOne({ userId })
    if (!activeCart) {
      return res.status(404).json({ msg: "Cart not found" })
    }

    activeCart.items = activeCart.items.filter(
      (item) => item.productId !== productId
    )

    await activeCart.save()
    res.json({ msg: "Item removed from cart", cart: activeCart })
  } catch (err) {
    res.status(500).json({ error: "Failed to remove item", details: err.message })
  }
}

router.delete("/:userId/items/:productId", handleRemoveItem)
router.delete("/:userId/remove/:productId", handleRemoveItem)

// Clear entire cart for user
router.delete("/:userId/clear", async (req, res) => {
  const { userId } = req.params
  try {
    const activeCart = await ShoppingCart.findOne({ userId })
    if (!activeCart) {
      return res.status(404).json({ msg: "Cart not found" })
    }

    activeCart.items = []
    await activeCart.save()
    res.json({ msg: "Cart cleared successfully", cart: activeCart })
  } catch (err) {
    res.status(500).json({ error: "Failed to clear cart", details: err.message })
  }
})

module.exports = router
