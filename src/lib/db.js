import mongoose from 'mongoose';

export const connectDB =async()=>{
    try{
        const connection = await mongoose.connect("mongodb://localhost:27017/chat_db")//(process.env.MONGODB_URI);
        console.log('Database connected successfully:', connection.connection.host);
    }catch(error){
        console.log('Database connection failed:', error);
    }

}