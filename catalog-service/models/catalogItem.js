const mongoose = require("mongoose")

const catalogItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  stock: { type: Number, default: 0, min: 0 },
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("CatalogItem", catalogItemSchema)
