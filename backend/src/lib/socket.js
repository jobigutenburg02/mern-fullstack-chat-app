import { Server } from 'socket.io'
import http from 'http'
import express from 'express'

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173']
    }
})

export function getReceiverSocketId(userId) {
    return userSocketMap[userId]
}

// used to store online users
const userSocketMap = {} // {userId: socketId}

// Listen for new socket connections
io.on('connection', (socket) => {
    console.log('a user connected', socket.id)

    const userId = socket.handshake.query.userId
    if(userId) userSocketMap[userId] = socket.id
    
    // used to send events to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap))
    
    // Listen for socket disconnect event
    socket.on('disconnect', () => {
        console.log('a user disconnected', socket.id)
        delete userSocketMap[userId] // Remove user from online users map
        io.emit("getOnlineUsers", Object.keys(userSocketMap)) // Emit updated list of online users
    })
})

export { io, app, server }