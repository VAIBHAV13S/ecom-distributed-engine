const express = require("express")
const dotenv = require("dotenv")
const mongoose = require("mongoose")
const orderRoutes = require("./routes/order")

const PORT = process.env.PORT || 5003

dotenv.config()
const app = express()

app.use(express.json())

// routes
app.use("/api/v1/orders", orderRoutes)
app.use("/api/orders", orderRoutes)

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Order Service is Connected to MongoDB")
    app.listen(PORT, () => {
      console.log(`Order Service is running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("🚫 Error connecting to MongoDB -> Order Service", err)
  })
