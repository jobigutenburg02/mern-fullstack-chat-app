## Tech Stack Used

- **Backend:** Express.js, Node.js, MongoDB, Socket.io, Cloudinary
- **Frontend:** React, Vite, Zustand, DaisyUI, Tailwind CSS
- **Authentication:** JWT (JSON Web Token)
- **Image Uploads:** Cloudinary

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

## Support

For support and questions:
- Create an issue in the repository
- Contact: jbros2513@gmail.com
```
