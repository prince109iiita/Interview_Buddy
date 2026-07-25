const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const connectToDB = require("./config/database")

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}))

// make sure a real DB connection exists before any route handler runs, instead of
// hoping connectToDB() (fired at cold start, below) finished in time. On warm
// invocations this resolves instantly since the connection is already cached.
app.use(async (req, res, next) => {
    try {
        await connectToDB()
        next()
    } catch (err) {
        console.error("Database connection failed:", err.message)
        res.status(503).json({
            message: "Database temporarily unavailable. Please try again in a moment."
        })
    }
})

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)



module.exports = app
