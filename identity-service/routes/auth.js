const express = require("express")
const Account = require("../models/account")
const argon2 = require("argon2")
const jwt = require("jsonwebtoken")

const router = express.Router()

// Register a new customer account
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body

    const existingAccount = await Account.findOne({ email })
    if (existingAccount) {
      return res.status(400).json({ error: "Account already exists with this email" })
    }

    const newAccount = new Account({ name, email, password })
    await newAccount.save()

    const authToken = jwt.sign(
      { accountId: newAccount._id, email: newAccount.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    )

    res.status(201).json({
      message: "Account registered successfully",
      accountId: newAccount._id,
      token: authToken,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Authenticate customer account & login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const accountRecord = await Account.findOne({ email })
    if (!accountRecord) {
      return res.status(400).json({ error: "No account found with this email" })
    }

    const passwordMatch = await argon2.verify(accountRecord.password, password)
    if (!passwordMatch) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    const authToken = jwt.sign(
      { accountId: accountRecord._id, email: accountRecord.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    )

    res.json({
      message: "Authentication successful",
      accountId: accountRecord._id,
      token: authToken,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Retrieve account profile
router.get("/profile/:accountId", async (req, res) => {
  try {
    const accountRecord = await Account.findById(req.params.accountId).select("-password")
    if (!accountRecord) {
      return res.status(404).json({ error: "Account not found" })
    }
    res.json(accountRecord)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
