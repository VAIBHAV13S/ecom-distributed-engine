const express = require("express")
const dotenv = require("dotenv")
const mongoose = require("mongoose")
const catalogRoutes = require("./routes/catalog")

const PORT = process.env.PORT || 5001

const app = express()
dotenv.config()

app.use(express.json())

// Routes (versioned and standard)
app.use("/api/v1/products", catalogRoutes)
app.use("/api/products", catalogRoutes)

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Catalog Service is Connected to MongoDB")
    app.listen(PORT, () => {
      console.log(`Catalog Service is running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("🚫 Error connecting to MongoDB -> Catalog Service", err)
  })
