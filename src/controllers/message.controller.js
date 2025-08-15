import User from '../models/user.model.js';
import Message from '../models/message.model.js';
import cloudinary from '../lib/cloudinary.js';

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

export const sendMessage = async (req, res) => {
    const { content,media } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!receiverId || !content) {
        return res.status(400).json({ message: 'Receiver ID and content are required' });
    }

    try {
        let mediaUrl;
        if (media) {
            const uploadResult = await cloudinary.uploader.upload(media, {
                folder: 'chat_app_messages',
                resource_type: 'auto'
            });
            mediaUrl = uploadResult.secure_url;
        }
        const newMessage = new Message({
            senderId,
            receiverId,
            content,
            media: mediaUrl
        });

        //todo : real-time 

        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: 'Error sending message', error });
    }
}