import { generateToken } from '../lib/utils.js'
import User from '../models/user.model.js'
import bcrypt from 'bcryptjs'
import cloudinary from '../lib/cloudinary.js'

export const signup = async (req, res) => {
    const {fullName, email, password} = req.body
    try{

        if(!fullName || !email || !password){
            return res.status(400).json({ message: "All fields are required" })
        }

        if(password.length < 6){
            return res.status(400).json({ message: "Password must be atleast 6 characters" })
        }

        const user = await User.findOne({email})
        if(user) return res.status(400).json({ message: "Email already exists" })
        
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword
        })

        if(newUser){
            // generate jwt token here
            generateToken(newUser._id, res)
            await newUser.save()

            res.status(201).json({
                _id:newUser._id, 
                fullName: newUser.fullName, 
                email: newUser.email, 
                profilePic: newUser.profilePic
            })
        }else{
           res.status(400).json({ message: "Invalid user data" })
        }
    }catch(error){
        console.log("Error while signing up: ", error.message)
        res.status(500).json({ message: "Internal Server Error" })
    }
}

export const login = async (req, res) => {
    const {email, password} = req.body
    try{
        const user = await User.findOne({email})
        if(!user) return res.status(400).json({ message: "Invalid credentials" })
        
        const passwordMatch = await bcrypt.compare(password, user.password)
        if(!passwordMatch) return res.status(400).json({ message: "Invalid credentials" })

        generateToken(user._id, res)
        res.status(200).json({
            _id: user._id, 
            fullName: user.fullName, 
            email: user.email, 
            profilePic: user.profilePic
        })
    }catch(error){
        console.log("Error while login: ", error.message)
        res.status(500).json({ message: "Internal Server Error" })
    }

}

export const logout = (req, res) => {
    try{
        res.cookie("jwtToken", "", { maxAge:0 }) // clear cookie
        res.status(200).json({ message: "Logged out successfully" })
    }catch(error){
        console.log("Error while logout: ", error.message)
        res.status(500).json({ message: "Internal Server Error" })
    }
}

export const updateProfile = async (req, res) => {
    try{
        const {profilePic} = req.body
        const userId = req.user._id // accessed from profileRoute middleware fn

        if(!profilePic) return res.status(400).json({ message: "Profile pic is required" })
        
        const uploadResponse = await cloudinary.uploader.upload(profilePic)
        // update user in db with new profile pic url provided by cloudinary
        const updatedUser = await User.findByIdAndUpdate(userId, {profilePic: uploadResponse.secure_url}, {new:true})

        res.status(200).json(updatedUser)
    }catch(error){
        console.log("Error in updating profile: ", error.message)
        res.status(500).json({ message: "Internal Server Error" })
    }
}

export const checkAuth = (req, res) => {
    try{
        res.status(200).json(req.user) // sends authenticated user to client
    }catch(error){
        console.log("Error while checking user authentication: ", error.message)
        res.status(500).json({ message: "Internal Server Error" })
    }
}