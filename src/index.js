import express from 'express';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './lib/db.js';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}))
const PORT = process.env.PORT;

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/message", messageRoutes);

app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
    connectDB();
})