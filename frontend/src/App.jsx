import { create } from 'zustand'
import { axiosInstance } from '../src/lib/axios'
import toast from 'react-hot-toast'
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
        try {
            const res = await axiosInstance.get('/auth/check')
            set({ authUser: res.data })
            get().connectSocket()
        } catch (error) {
            set({ authUser: null })
        } finally {
            set({ isCheckingAuth: false })
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true })
        try {
            const res = await axiosInstance.post('/auth/signup', data)
            set({ authUser: res.data })
            toast.success('User created successfully')
            get().connectSocket()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to sign up')
        } finally {
            set({ isSigningUp: false })
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true })
        try {
            const res = await axiosInstance.post('/auth/login', data)
            set({ authUser: res.data })
            toast.success('Logged in successfully')
            get().connectSocket()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to log in')
        } finally {
            set({ isLoggingIn: false })
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post('/auth/logout')
            set({ authUser: null })
            toast.success('Logged out successfully')
            get().disconnectSocket()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to log out')
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true })
        try {
            const res = await axiosInstance.put('/auth/update-profile', data)
            set({ authUser: res.data })
            toast.success('User profile updated successfully')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to update profile')
        } finally {
            set({ isUpdatingProfile: false })
        }
    },

    connectSocket: () => {
        const { authUser } = get()
        if (!authUser) return

        const existingSocket = get().socket
        if (existingSocket?.connected) return

        if (existingSocket) {
            existingSocket.disconnect()
        }

        const socket = io(BASE_URL, {
            query: {
                userId: authUser._id,
            },
        })

        socket.on('getOnlineUsers', (userIds) => {
            set({ onlineUsers: userIds })
        })

        socket.on('disconnect', () => {
            set({ onlineUsers: [] })
        })

        set({ socket })
    },

    disconnectSocket: () => {
        const socket = get().socket

        if (!socket) {
            set({ onlineUsers: [] })
            return
        }

        socket.off('getOnlineUsers')
        socket.disconnect()
        set({ socket: null, onlineUsers: [] })
    },
}))
