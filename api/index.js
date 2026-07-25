require("dotenv").config()
const app = require("../Backend/src/app")
const connectToDB = require("../Backend/src/config/database")

connectToDB().catch((err) => console.error("Initial DB connection attempt failed:", err.message))

module.exports = app
