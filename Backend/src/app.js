const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

const frontendUrl = process.env.FRONTEND_URL || "https://interview-yt.vercel.app"

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: frontendUrl,
    credentials: true
}))

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)



module.exports = app