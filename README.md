## Tech Stack Used

- **Backend:** Express.js, Node.js, MongoDB, Socket.io, Cloudinary
- **Frontend:** React, Vite, Zustand, DaisyUI, Tailwind CSS
- **Authentication:** JWT (JSON Web Token)
- **Image Uploads:** Cloudinary

---

## Repository Overview

This project is a full-stack real-time chat application built with the MERN stack. The backend uses Express and MongoDB to manage users, messages, and JWT-based authentication, while the frontend uses React + Vite to provide a responsive chat experience. It also integrates Socket.io for realtime online presence and message delivery, along with Cloudinary for profile image uploads.

The app is designed around a simple chat workflow:

- Users sign up or log in with JWT cookies that are validated on the backend.
- The frontend uses Zustand stores to manage auth state, selected chat conversations, and message data.
- Socket.io is used to keep online users and incoming messages synchronized in real time.
- Cloudinary stores profile images and optional chat attachments, reducing server storage pressure and enabling fast delivery.

### High-level project layout

- `backend/src/index.js` — Express app entry point and Socket.io server setup
- `backend/src/controllers/` — auth and message logic
- `backend/src/routes/` — route definitions for auth and messaging APIs
- `backend/src/models/` — Mongoose schemas for `User` and `Message`
- `backend/src/lib/` — DB connection, JWT utility, and socket helpers
- `frontend/src/pages/` — login, signup, home, profile, and settings screens
- `frontend/src/components/` — reusable UI like sidebar, chat window, and message input
- `frontend/src/store/` — Zustand state management for auth and chat data

The runtime shape is a single Node.js backend that serves the built frontend bundle while also exposing the APIs and socket event layer. In practice, the app acts as both the API server and the production web host for the React app.

---

## How Socket.io is used in this app

Socket.io is used for realtime communication between the browser and the backend. The pattern in this project is simple and effective for a one-to-one chat system:

### 1. Client connects to the backend socket

In `frontend/src/store/useAuthStore.js`, after authentication succeeds, the app calls `connectSocket()` and creates a socket connection to the backend:

```js
const socket = io(BASE_URL, {
  query: {
    userId: authUser._id,
  },
})
```

This attaches the logged-in user's MongoDB `_id` as a query param so the server knows which user is connected.

### 2. Server tracks online users in memory

In `backend/src/lib/socket.js`, the server keeps a map like this:

```js
const userSocketMap = {}
```

When a client connects, the server stores:

```js
const userId = socket.handshake.query.userId
if (userId) userSocketMap[userId] = socket.id
```

This allows the server to know which socket belongs to which user.

### 3. Server broadcasts online users

After each connection or disconnect, the server emits an event to all clients:

```js
io.emit("getOnlineUsers", Object.keys(userSocketMap))
```

The frontend listens for `getOnlineUsers` in `useAuthStore.js` and stores the active user IDs in `onlineUsers`:

```js
socket.on('getOnlineUsers', (userIds) => {
  set({ onlineUsers: userIds })
})
```

This powers the online/offline indicators in the sidebar.

### 4. New messages are delivered in real time to the recipient

When a message is sent, the backend saves it to MongoDB and then looks up the recipient's socket using the stored map:

```js
const receiverSocketId = getReceiverSocketId(receiverId)
if (receiverSocketId) {
  io.to(receiverSocketId).emit('newMessage', newMessage)
}
```

This is handled in `backend/src/controllers/message.controller.js`.

### 5. The frontend listens for incoming messages

In `frontend/src/store/useChatStore.js`, the app subscribes to the `newMessage` event and updates the active chat instantly:

```js
socket.on('newMessage', (newMessage) => {
  const isMessageSentFromSelectedUser = newMessage.senderId !== selectedUser._id
  if (isMessageSentFromSelectedUser) return

  set({
    messages: [...get().messages, newMessage]
  })
})
```

This creates a realtime chat experience without requiring a page refresh.

### 6. Why this works well here

This app is designed around a one-to-one messaging model, so Socket.io is ideal because it lets the server:

- know when a user is online,
- push messages to the correct client,
- and keep the sidebar and open conversation in sync.

The tradeoff is that this in-memory map is not multi-instance safe. In production, if multiple backend servers run behind a load balancer, the map should be replaced with Redis-backed socket state and a Socket.io adapter.

---

## Features

- Real-time one-to-one chat using Socket.io
- Secure JWT-based authentication and route protection
- Profile image upload and user personalization via Cloudinary
- Responsive, themeable UI with DaisyUI and Tailwind CSS
- RESTful API endpoints for users and messages

---

## Setting up MongoDB Cluster

1. **Create a MongoDB Atlas Account:**  
   [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Create a New Cluster:**  
   - Choose Free Shared Cluster (M0)
   - Select provider & region
   - Name your cluster

3. **Set Up Database Access:**  
   - Add new database user (username/password)
   - Grant read/write access

4. **Add IP Whitelist:**  
   - Allow access from anywhere (`0.0.0.0/0`)

5. **Get Your MongoDB URI:**  
   - Copy connection string and add to `.env`:
     ```
     MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority
     ```

---

## Setting up the Environment Variables

**Backend `.env`:**
```env
JWT_SECRET=random#secret
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=3000
NODE_ENV="development"
```

## API Endpoints

### Auth Routes (`/api/auth`)
- **POST `/signup`**  
  Register a new user.
- **POST `/login`**  
  Log in an existing user.
- **POST `/logout`**  
  Log out the current user.
- **PUT `/update-profile`**  
  Update the user's profile picture (requires authentication).
- **GET `/check`**  
  Check if the user is authenticated (requires authentication).

### Message Routes (`/api/messages`)
- **GET `/users`**  
  Get all users except the authenticated user (requires authentication).
- **GET `/:id`**  
  Get all messages between the authenticated user and another user by ID (requires authentication).
- **POST `/send/:id`**  
  Send a message (text and/or image) to another user by ID (requires authentication).

---

**Note:**  
All endpoints requiring authentication expect a valid JWT token in cookies.

---

## Production Workflow Example

This project can be deployed as a single Node.js server that serves both the API and the built frontend bundle.

### 1. Build frontend

```bash
cd frontend
npm install
npm run build
```

This generates the production bundle in `frontend/dist`.

### 2. Start backend in production

```bash
cd backend
npm install
NODE_ENV=production PORT=3000 JWT_SECRET=your_secret \
MONGODB_URI="mongodb+srv://..." \
CLOUDINARY_CLOUD_NAME=your_cloud_name \
CLOUDINARY_API_KEY=your_api_key \
CLOUDINARY_API_SECRET=your_api_secret \
node src/index.js
```

### 3. Serve behind a reverse proxy (Nginx example)

```nginx
server {
  listen 80;
  server_name chat.example.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

This pattern is useful for TLS termination, load balancing, and serving the app behind a custom domain.

---

## Support

For support and questions:
- Create an issue in the repository
- Contact: johanbiju02@gmail.com
