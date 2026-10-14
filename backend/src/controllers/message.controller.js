import mongoose from 'mongoose'
import User from '../models/user.model.js'
import Message from '../models/message.model.js'
import cloudinary from '../lib/cloudinary.js'
import { getReceiverSocketId, io } from '../lib/socket.js'

export const getUsers = async (req, res) => {
  try {
    const userId = req.user._id
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user id' })
    }
    const userObjectId = new mongoose.Types.ObjectId(userId)

    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 25))
    const skip = (page - 1) * limit

    const usersWithLastMessage = await User.aggregate([
      // exclude self
      { $match: { _id: { $ne: userObjectId } } },

      // lookup most recent message between auth user and this user
      {
        $lookup: {
          from: 'messages',
          let: { otherId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $and: [
                        { $eq: ['$senderId', '$$otherId'] },
                        { $eq: ['$receiverId', userObjectId] }
                      ]
                    },
                    {
                      $and: [
                        { $eq: ['$senderId', userObjectId] },
                        { $eq: ['$receiverId', '$$otherId'] }
                      ]
                    }
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'lastMessage'
        }
      },

      { $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true } },
      { $project: { password: 0 } },
      { $sort: { 'lastMessage.createdAt': -1, updatedAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ])

    res.status(200).json(usersWithLastMessage)
  } catch (error) {
    console.log('Error while fetching users for sidebar: ', error.message)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params
    const myId = req.user._id

    if (!mongoose.isValidObjectId(userToChatId) || !mongoose.isValidObjectId(myId)) {
      return res.status(400).json({ message: 'Invalid user id' })
    }
    const userToChatObjectId = new mongoose.Types.ObjectId(userToChatId)
    const myObjectId = new mongoose.Types.ObjectId(myId)

    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50))
    const skip = (page - 1) * limit

    // return messages in ascending order (oldest first)
    const messages = await Message.find({
      $or: [
        { senderId: myObjectId, receiverId: userToChatObjectId },
        { senderId: userToChatObjectId, receiverId: myObjectId },
      ],
    })
      .sort({ createdAt: 1 }) // oldest -> newest
      .skip(skip)
      .limit(limit)

    res.status(200).json(messages)
  } catch (error) {
    console.log('Error while fetching messages: ', error.message)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}
