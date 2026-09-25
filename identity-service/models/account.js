const mongoose = require("mongoose")
const argon2 = require("argon2")

const accountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

accountSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    this.password = await argon2.hash(this.password)
    next()
  } catch (error) {
    return next(error)
  }
})

module.exports = mongoose.model("Account", accountSchema)
