import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from 'socket.io-client'

const MODE = import.meta.env.MODE || 'production'

const BASE_URL = MODE === 'development' ? 'http://localhost:3000' : '/'

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async () => {
        try{
            const res = await axiosInstance.get('/auth/check')
            set({ authUser: res.data })
            get().connectSocket()
        }catch(error){
            console.log("Error while checking user authentication", error)
            set({ authUser: null })
        }finally{
            set({ isCheckingAuth: false })
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true })
        try{
            const res = await axiosInstance.post('/auth/signup', data)
            set({ authUser: res.data })
            toast.success("User created successfully")
            get().connectSocket()
        }catch(error){
            console.log("Error while signing up", error)
            toast.error(error.response.data.message)
        }finally{
            set({ isSigningUp: false })
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({ authUser: res.data });
            toast.success("Logged in successfully");
            get().connectSocket()
        } catch (error) {
            console.log("Error while logging in", error)
            toast.error(error.response.data.message);
        } finally {
            set({ isLoggingIn: false });
        }
    },

    logout: async () => {
        try{
            await axiosInstance.post('/auth/logout')
            set({ authUser: null })
            toast.success("Logged out successfully")
            get().disconnectSocket()
        }catch(error){
            console.log("Error while logging out", error)
            toast.error(error.response.data.message)
        }
    },

    updateProfile: async(data) => {
        set({ isUpdatingProfile: true })
        try{
            const res = await axiosInstance.put('/auth/update-profile', data)
            set({ authUser: res.data })
            toast.success("User profile updated successfully")
        }
        catch(error){
            console.log("Error while updating profile", error)
            toast.error(error.response.data.message)
        }finally{
            set({ isUpdatingProfile: false })
        }
    },

    connectSocket: () => {
        const { authUser } = get()
        if(!authUser || get().socket?.connected) return;

        const socket = io(BASE_URL, {
            query: {
                userId: authUser._id,
            },
        })
        socket.connect()

        set({ socket: socket })

        socket.on('getOnlineUsers', (userIds) => {
            set({ onlineUsers: userIds })
        })
    },
    disconnectSocket: () => {
        if(get().socket?.connected) get().socket.disconnect()
    },
}))
