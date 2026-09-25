const express = require("express")
const dotenv = require("dotenv")
const mongoose = require("mongoose")
const billingRoutes = require("./routes/billing")

const PORT = process.env.PORT || 5004

dotenv.config()
const app = express()

app.use(express.json())

// routes
app.use("/api/v1/payments", billingRoutes)
app.use("/api/payments", billingRoutes)

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Billing Service is Connected to MongoDB")
    app.listen(PORT, () => {
      console.log(`Billing Service is running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("🚫 Error connecting to MongoDB -> Billing Service", err)
  })
