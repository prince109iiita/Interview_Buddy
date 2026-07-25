require("dotenv").config()
const app = require("./src/app")
const connectToDB = require("./src/config/database")

connectToDB().catch((err) => console.error("Initial DB connection attempt failed:", err.message))


app.listen(3000, () => {
    console.log("Server is running on port 3000")
})
