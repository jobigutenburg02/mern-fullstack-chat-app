## Tech Stack Used

- **Backend:** Express.js, Node.js, MongoDB, Socket.io, Cloudinary
- **Frontend:** React, Vite, Zustand, DaisyUI, Tailwind CSS
- **Authentication:** JWT (JSON Web Token)
- **Image Uploads:** Cloudinary

---

## Repository Overview

This project is a full-stack real-time chat application built with the MERN stack. The backend uses Express and MongoDB to manage users, messages, and JWT-based authentication, while the frontend is a React + Vite app for the chat experience, profile management, and auth pages.

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

The runtime shape is a single Node.js backend that serves the built frontend bundle while also exposing the APIs and socket event layer. In practice, the app acts as both the API server and the production web server for the client build.

---

## Features

- Real-time one-to-one chat using Socket.io
- Secure JWT-based authentication and route protection
- Profile image upload and user personalization via Cloudinary
- Responsive, themeable UI with DaisyUI and Tailwind CSS
- RESTful API endpoints for users and messages

---

## Performance Considerations and Potential Issues

This app is functional and lightweight, but there are a few areas where performance may degrade as the number of users and messages increases.

### 1. Full conversation history is loaded without pagination or limits

In `backend/src/controllers/message.controller.js`, `getMessages` fetches all messages between two users with no sorting, limit, or pagination:

- `Message.find({ $or: [...] })` loads every message in the conversation.
- As chat history grows, response size and client rendering time will increase substantially.
- A better pattern is to add sorting (for example, by `createdAt`) and pagination or a message window.

Suggested improvement:

```js
const messages = await Message.find({ ... }).sort({ createdAt: 1 }).limit(100)
```

### 2. Sidebar fetches all users at once

In `backend/src/controllers/message.controller.js`, `getUsers` returns every user except the current one with no search, filtering, or pagination.

This can become slow when many users exist and the sidebar constantly re-renders or fetches this list. For a production app, it would be better to:

- paginate the user list,
- search/filter by name or email,
- or fetch only active or recent contacts.

### 3. Unbounded message list in the frontend state

In `frontend/src/store/useChatStore.js`, messages are appended to the state array directly and the entire history is stored in memory. Long conversations can cause:

- larger re-renders,
- slower scroll performance,
- higher memory usage on client devices.

A more scalable approach is to keep only a page of messages in state and load older messages on demand.

### 4. Socket listeners can be duplicated or poorly managed

In `frontend/src/store/useChatStore.js`, `subscribeToMessages()` attaches a `newMessage` socket listener every time the selected user changes, and `unsubscribeFromMessages()` removes all listeners with `socket.off("newMessage")`.

This pattern can cause listener leakage or stale event handling, especially if component mounts/unmounts happen repeatedly. A cleaner approach is to attach a single listener with a scoped callback or remove only the exact handler that was added.

### 5. Message upload is synchronous and may block requests

In `backend/src/controllers/message.controller.js`, if an image is present, the server uploads it to Cloudinary before saving the message. For large or many images, this can slow the API response and increase latency.

Recommended improvements:

- compress uploaded images on the client before sending,
- impose size limits,
- and consider async queueing or background processing for heavy media workflows.

### 6. Repeated scroll operations and unnecessary logging

In `frontend/src/App.jsx` and other components, there are multiple `console.log` calls. These are harmless in development but noisy in production and can hurt performance in large apps.

Also, `scrollIntoView({ behavior: 'smooth' })` is triggered whenever message state changes. For long chat histories, this can be jarring and expensive; using a conditional scroll only when the user is near the bottom is a better UX/performance tradeoff.

### 7. Potential duplicate socket connections

In `frontend/src/store/useAuthStore.js`, `connectSocket()` checks whether a socket is already connected, but repeated auth checks or quick login/logout transitions may still create lifecycle edge cases. For production reliability, it is wise to guard socket creation more strictly and clean up stale connections when auth state changes.

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

## Support

For support and questions:
- Create an issue in the repository
- Contact: johanbiju02@gmail.com
