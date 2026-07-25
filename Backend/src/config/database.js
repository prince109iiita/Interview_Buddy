const mongoose = require("mongoose")

// cached across warm serverless invocations so we reuse one connection instead of
// opening a new one on every request (which is also what was pushing this project
// toward Atlas's connection limit on repeated cold starts)
let cached = global._mongooseCache
if (!cached) {
    cached = global._mongooseCache = { conn: null, promise: null }
}

async function connectToDB() {

    if (cached.conn) {
        return cached.conn
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 5,
            serverSelectionTimeoutMS: 5000, // fail in 5s instead of hanging most of the function's timeout budget
            bufferCommands: false // fail immediately if not connected, instead of queuing queries
                                   // for 10s and then throwing a vague "buffering timed out" error
        }).catch((err) => {
            cached.promise = null // so the NEXT request retries instead of staying stuck forever
            throw err
        })
    }

    cached.conn = await cached.promise
    console.log("Connected to Database")
    return cached.conn
}

module.exports = connectToDB
