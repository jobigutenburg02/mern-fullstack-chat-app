import dotenv from 'dotenv'
import express from 'express'
import cookieParser from 'cookie-parser'
import { connectDB } from './lib/db.js';
import authRoutes from './routes/auth.route.js'
import messageRoutes from './routes/message.route.js'
import cors from 'cors'
import path from 'path'
import { app, server } from './lib/socket.js';

dotenv.config()

const PORT = process.env.PORT
const _dirname = path.resolve()

// middlewares
app.use(express.json({ limit: '5mb' }))
app.use(cookieParser())
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true // allow cookies/auth-headers to be sent with request to frontend
}))

// route middlewares
app.use('/api/auth', authRoutes)
app.use('/api/messages', messageRoutes)

// serve both frontend and backend in the same port
app.use(express.static(path.join(_dirname, "../frontend/dist")))
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(_dirname, "../frontend", "dist", "index.html"))
})

server.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`)
    connectDB()
})