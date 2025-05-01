import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { v2 as cloudinary } from 'cloudinary';
import connectMongoDB from './db/connectMongoDB.js';
import Post from './models/post.model.js';


// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import postRoutes from './routes/post.routes.js';
import notificationRoutes from './routes/notification.routes.js';


dotenv.config();

// ✅ Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const PORT = process.env.PORT || 5000;
const router = express.Router();



// ✅ Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'https://vibe-space.onrender.com', credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);


app.use('/api/notifications', notificationRoutes);
// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('✅ MongoDB connected successfully');
    await connectMongoDB();

    // Start server only after DB connection
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: { origin: process.env.FRONTEND_URL || '*', credentials: true },
    });
// Battle Schema
const battleSchema = new mongoose.Schema({
  title: String,
  description: String,
  level: String,
});
app.post("/like", async (req, res) => {
  const { postId, userId } = req.body;

  await Post.findByIdAndUpdate(postId, { $inc: { likes: 1 } });


  res.json({ message: "Post liked!" });
});


    // ✅ WebSocket Connection
    io.on('connection', (socket) => {
      console.log('🟢 New WebSocket connection:', socket.id);

      socket.on('disconnect', () => {
        console.log('🔴 WebSocket disconnected:', socket.id);
      });
    });

    // ✅ Start the Server
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


    app.get('/api/feed/forYou', async (req, res) => {
      try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json({ posts });
      } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    // ✅ Graceful Shutdown
    process.on('SIGINT', async () => {
      console.log('🔴 Closing MongoDB Connection...');
      await mongoose.connection.close();
      process.exit(0);
    });

  })
  
  .catch((err) => console.error('❌ MongoDB connection error:', err));
  export default router;