const MODE = import.meta.env.MODE || 'production'

export const axiosInstance = axios.create({
  baseURL: MODE === 'development' ? "http://localhost:3000/api" : "/api",
  withCredentials: true,
})