const express = require("express")
const dotenv = require("dotenv")
const mongoose = require("mongoose")
const authRoutes = require("./routes/auth")

const PORT = process.env.PORT || 5000

dotenv.config()
const app = express()

// middleware
app.use(express.json())

// routes
app.use("/api/v1/auth", authRoutes)

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Identity Service is Connected to MongoDB")
    app.listen(PORT, () => {
      console.log(`Identity Service is running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("🚫 Failed to connect to Database -> Identity Service", err)
  })
