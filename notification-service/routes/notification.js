const express = require("express")
const sendEmail = require("../services/emailService")
const sendSMS = require("../services/smsService")

const router = express.Router()

// Dispatch Email Notification
router.post("/email", async (req, res) => {
  const { to, subject, text } = req.body
  const recipientAddress = to
  const emailSubject = subject
  const bodyContent = text

  if (!recipientAddress || !emailSubject) {
    return res.status(400).json({ error: "Missing required email recipient or subject" })
  }

  try {
    await sendEmail(recipientAddress, emailSubject, bodyContent)
    res.status(200).json({ message: "Email notification dispatched successfully" })
  } catch (err) {
    res.status(500).json({ error: "Failed to dispatch email", details: err.message })
  }
})

// Dispatch SMS Notification
router.post("/sms", async (req, res) => {
  const { to, message } = req.body
  const recipientPhone = to
  const smsMessageBody = message

  if (!recipientPhone || !smsMessageBody) {
    return res.status(400).json({ error: "Missing required recipient phone number or message" })
  }

  try {
    await sendSMS(recipientPhone, smsMessageBody)
    res.status(200).json({ message: "SMS notification dispatched successfully" })
  } catch (err) {
    res.status(500).json({ error: "Failed to dispatch SMS", details: err.message })
  }
})

module.exports = router
