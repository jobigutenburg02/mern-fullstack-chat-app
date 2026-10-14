import mongoose from 'mongoose'
import User from '../models/user.model.js'
import Message from '../models/message.model.js'
import cloudinary from '../lib/cloudinary.js'
import { getReceiverSocketId, io } from '../lib/socket.js'

export const getUsers = async (req, res) => {
    try {
        const userId = req.user._id
        const page = Math.max(1, Number(req.query.page) || 1)
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 25))
        const skip = (page - 1) * limit

        // Aggregate users with their latest message (between auth user and each other user)
        const usersWithLastMessage = await User.aggregate([
            // exclude self
            { $match: { _id: { $ne: mongoose.Types.ObjectId(userId) } } },

            // lookup the most recent message between auth user and this user
            {
                $lookup: {
                    from: 'messages', // collection name (mongodb lowercased plural)
                    let: { otherId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        {
                                            $and: [
                                                { $eq: ['$senderId', '$$otherId'] },
                                                { $eq: ['$receiverId', mongoose.Types.ObjectId(userId)] }
                                            ]
                                        },
                                        {
                                            $and: [
                                                { $eq: ['$senderId', mongoose.Types.ObjectId(userId)] },
                                                { $eq: ['$receiverId', '$$otherId'] }
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        { $sort: { createdAt: -1 } }, // latest first
                        { $limit: 1 }                 // only the last message
                    ],
                    as: 'lastMessage'
                }
            },

            // flatten lastMessage array (may be empty)
            { $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true } },

            // remove sensitive fields
            { $project: { password: 0 } },

            // sort by last message time desc (users with no messages will sort by updatedAt desc)
            { $sort: { 'lastMessage.createdAt': -1, updatedAt: -1 } },

            // pagination
            { $skip: skip },
            { $limit: limit }
        ])

        res.status(200).json(usersWithLastMessage)
    } catch (error) {
        console.log('Error while fetching users for sidebar: ', error.message)
        res.status(500).json({ message: 'Internal Server Error' })
    }
}
