require("dotenv").config()
const app = require("../Backend/src/app")
const connectToDB = require("../Backend/src/config/database")

connectToDB()

module.exports = app
