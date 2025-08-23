// message.controller.js
import User from '../models/user.model.js';
import Message from '../models/message.model.js';
import cloudinary from '../lib/cloudinary.js';
import { getReceiverSocketId, io } from '../lib/socket.js';

export const getFriends = async (req, res) => {
    try {
        const friends = await User.find({ _id: { $ne: req.user._id } }).select('firstName lastName _id profilePicture');
        res.status(200).json(friends);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving friends', error });
    }
}

export const getMessages = async (req, res) => {
    const { userToChatId } = req.params;
    const userId = req.user._id;
    try {
        const messages = await Message.find({
            $or: [
                { senderId: userId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: userId }
            ]
        });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving messages', error });
    }
}

export const isDoingSomething = (req, res) => {
    const { type } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    console.log("Doing something:", receiverId);
    
    if (!receiverId || !senderId) {
        return res.status(400).json({ message: "Missing required parameters" });
    }

    try {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('userDoSomething', {
                senderId,
                type: type
            });
        }
        res.status(200).json({ isDoingSomething: true, type: type });
    } catch (error) {
        res.status(500).json({ message: 'Error sending typing status', error });
    }
}

export const sendMessage = async (req, res) => {
  const { content, media, type } = req.body;
  const { id: receiverId } = req.params;
  const senderId = req.user._id;

  try {
    let mediaUrl;

    // Upload media if exists
    if (media) {
      let uploadOptions = {
        folder: "chat_app_messages",
      };

      // تحديد نوع الملف بناءً على النوع
      if (type === "audio") {
        uploadOptions.resource_type = "video"; // Cloudinary يتعامل مع الصوت كـ video
        uploadOptions.format = "webm"; // تأكد من الصيغة
      } else if (type === "image") {
        uploadOptions.resource_type = "image";
      } else {
        uploadOptions.resource_type = "auto";
      }

      const uploadResult = await cloudinary.uploader.upload(media, uploadOptions);
      mediaUrl = uploadResult.secure_url;
      
      console.log(`${type} uploaded successfully:`, mediaUrl);
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      content: content || "", 
      media: mediaUrl,
      type: type || (media ? (type === "audio" ? "audio" : "image") : "text"), 
    });

    await newMessage.save();

    // Real-time delivery
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Error sending message", error: error.message });
  }
};