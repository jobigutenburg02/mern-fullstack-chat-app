import User from '../models/user.model.js'
import Message from '../models/message.model.js'
import cloudinary from '../lib/cloudinary.js'
import { getReceiverSocketId, io } from '../lib/socket.js'

export const getUsers = async (req, res) => {
    try{
        const userId = req.user._id
        const filteredUsers = await User.find({_id: {$ne: userId}}).select("-password")

        res.status(200).json(filteredUsers)
    }catch(error){
        console.log("Error while fetching users for sidebar: ", error.message)
        res.status(500).json({ message: "Internal Server Error" })
    }
}

export const getMessages = async (req, res) => {
    try{
        const { id: userToChatId } = req.params
        const myId = req.user._id

        // find all messages where user is sender and other user is receiver, or vice-versa
        const messages = await Message.find({
            $or: [
                {senderId: myId, receiverId: userToChatId},
                {senderId: userToChatId, receiverId: myId}
            ]
        })

        res.status(200).json(messages)
    }catch(error){
        console.log("Error while fetching messages: ", error.message)
        res.status(500).json({ message: "Internal Server Error" })
    }
}

export const sendMessage = async (req, res) => {
    try{
        const { text, image } = req.body
        const { id: receiverId } = req.params // receiver's id is fetched from '/send/(id)' as parameter
        const senderId = req.user._id

        let imageUrl;
        if(image){
            //upload base64 img to cloudinary
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        })
        
        await newMessage.save()

        const receiverSocketId = getReceiverSocketId(receiverId)
        // receiver is online
        if(receiverSocketId){
            // io.to().emit() is used bcz it is a one-to-one chat
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }

        res.status(201).json(newMessage)
    } catch(error){
        console.log("Error while sending message: ", error.message)
        res.status(500).json({ message: "Internal Server Error" })
    }
}