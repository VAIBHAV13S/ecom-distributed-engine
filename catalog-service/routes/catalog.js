const express = require("express")
const CatalogItem = require("../models/catalogItem")

const router = express.Router()

// Create a new catalog item
router.post("/", async (req, res) => {
  const { name, description, price, category, stock } = req.body
  try {
    const createdItem = new CatalogItem({
      name,
      description,
      price,
      category,
      stock: stock !== undefined ? stock : 0,
    })
    await createdItem.save()
    res.status(201).json(createdItem)
  } catch (err) {
    res.status(500).json({ error: "Failed to create catalog item", details: err.message })
  }
})

// Backwards-compatible create route
router.post("/create", async (req, res) => {
  const { name, description, price, category, stock } = req.body
  try {
    const createdItem = new CatalogItem({
      name,
      description,
      price,
      category,
      stock: stock !== undefined ? stock : 0,
    })
    await createdItem.save()
    res.status(201).json(createdItem)
  } catch (err) {
    res.status(500).json({ error: "Failed to create catalog item", details: err.message })
  }
})

// Retrieve all catalog items
router.get("/", async (req, res) => {
  try {
    const { category, minPrice, maxPrice } = req.query
    const queryFilter = {}

    if (category) {
      queryFilter.category = category
    }
    if (minPrice || maxPrice) {
      queryFilter.price = {}
      if (minPrice) queryFilter.price.$gte = Number(minPrice)
      if (maxPrice) queryFilter.price.$lte = Number(maxPrice)
    }

    const catalogItems = await CatalogItem.find(queryFilter)
    res.json(catalogItems)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch catalog items", details: err.message })
  }
})

// Retrieve catalog item by ID
router.get("/:id", async (req, res) => {
  try {
    const itemRecord = await CatalogItem.findById(req.params.id)
    if (!itemRecord) {
      return res.status(404).json({ msg: "Catalog item not found" })
    }
    res.json(itemRecord)
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve item", details: err.message })
  }
})

// Update catalog item details
router.put("/:id", async (req, res) => {
  const { name, description, price, category, stock } = req.body
  try {
    const updatedItem = await CatalogItem.findByIdAndUpdate(
      req.params.id,
      { name, description, price, category, stock },
      { new: true, runValidators: true }
    )

    if (!updatedItem) {
      return res.status(404).json({ msg: "Catalog item not found" })
    }
    res.json(updatedItem)
  } catch (err) {
    res.status(500).json({ error: "Failed to update item", details: err.message })
  }
})

// Deduct inventory stock (used during order checkout)
router.put("/:id/deduct", async (req, res) => {
  const { quantity } = req.body
  const deductQty = Number(quantity) || 1

  try {
    const itemRecord = await CatalogItem.findById(req.params.id)
    if (!itemRecord) {
      return res.status(404).json({ msg: "Catalog item not found" })
    }

    if (itemRecord.stock < deductQty) {
      return res.status(400).json({
        msg: "Insufficient stock available",
        available: itemRecord.stock,
        requested: deductQty,
      })
    }

    itemRecord.stock -= deductQty
    await itemRecord.save()

    res.json({
      msg: "Stock deducted successfully",
      itemId: itemRecord._id,
      remainingStock: itemRecord.stock,
    })
  } catch (err) {
    res.status(500).json({ error: "Failed to deduct stock", details: err.message })
  }
})

// Delete catalog item
router.delete("/:id", async (req, res) => {
  try {
    const deletedItem = await CatalogItem.findByIdAndDelete(req.params.id)
    if (!deletedItem) {
      return res.status(404).json({ msg: "Catalog item not found" })
    }
    res.json({ msg: "Catalog item deleted successfully" })
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item", details: err.message })
  }
})

module.exports = router
