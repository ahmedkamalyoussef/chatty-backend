# Chat Application Backend

A real-time chat application backend built with Node.js, Express, and Socket.IO.

## 🚀 Features

- **Real-time Communication**
  - Instant messaging
  - Typing indicators
  - Online/offline status
  - Voice messages support
  - Image sharing

- **Authentication & Security**
  - JWT-based authentication
  - Password hashing
  - Protected routes
  - Session management

- **User Management**
  - User profiles
  - Friend requests system
  - Online status tracking
  - Profile picture support

## 📋 Prerequisites

- Node.js (v14.0.0 or higher)
- MongoDB
- npm or yarn

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone https://your-repository-url.git
   cd chat-app-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=5001
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## 🏗️ API Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/        # Database models
├── routes/        # API routes
├── services/      # Business logic
├── socket/        # Socket.IO handlers
└── utils/         # Utility functions
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/logout` - Logout user

### Users
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### Messages
- `POST /api/v1/messages` - Send message
- `GET /api/v1/messages/:userId` - Get conversation
- `POST /api/v1/messages/doSomeThing/:userId` - Handle typing/recording indicators

### Friends
- `POST /api/v1/friends/request` - Send friend request
- `GET /api/v1/friends/requests` - Get friend requests
- `PUT /api/v1/friends/accept/:id` - Accept friend request
- `PUT /api/v1/friends/reject/:id` - Reject friend request

## 🔒 Socket Events

### Emitted Events
- `messageReceived` - New message received
- `userOnline` - User came online
- `userOffline` - User went offline
- `userDoSomething` - User typing/recording

### Listened Events
- `sendMessage` - Send new message
- `typing` - User started typing
- `stopTyping` - User stopped typing

## 🛠️ Built With

- [Express](https://expressjs.com/) - Web framework
- [Socket.IO](https://socket.io/) - Real-time communication
- [Mongoose](https://mongoosejs.com/) - MongoDB ODM
- [JWT](https://jwt.io/) - Authentication
- [Bcrypt](https://www.npmjs.com/package/bcrypt) - Password hashing

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributors

- Your Name - *Initial work* - [YourGithub](https://github.com/yourusername)

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request