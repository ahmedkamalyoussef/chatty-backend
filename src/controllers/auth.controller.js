import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt.js';
import cloudinary from '../lib/cloudinary.js';

export const signup = async (req, res) => {
    const { email, firstName, lastName, handle, password, confirmPassword } = req.body;
    try {
        if (password.length < 6)
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        if (handle.length < 4)
            return res.status(400).json({ message: "handle must be at least 4 characters long" });
        if (password !== confirmPassword)
            return res.status(400).json({ message: "Passwords do not match" });
        const userBymail = await User.findOne({ email });
        if (userBymail) return res.status(400).json({ message: "Email already exists" });
        const userByHandle = await User.findOne({ handle });
        if (userByHandle) return res.status(400).json({ message: "Handle already exists" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            email,
            firstName,
            lastName,
            handle,
            password: hashedPassword,
        })
        if (newUser) {
            generateToken(newUser._id, res);
            await newUser.save();
            res.status(201).json({
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                handle: newUser.handle,
                profilePicture: newUser.profilePicture,
            });
        } else {
            res.status(400).json({ message: "User creation failed" });
        }
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
export const login = async (req, res) => {
    const { identifier, password } = req.body;
    try {
        const user = await User.findOne({ $or: [{ email: identifier }, { handle: identifier }] }).select('+password');
        if (!user) return res.status(400).json({ message: "User not found" });
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(400).json({ message: "Invalid password" });
        generateToken(user._id, res);
        res.status(200).json({
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            handle: user.handle,
            profilePicture: user.profilePicture,
        });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
export const logout = (req, res) => {
    try {
        res.cookie('token', '', { maxAge: 0 });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Error during logout:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const updateProfilePic = async (req, res) => {
    const { profilePicture } = req.body;
    try {
        const userId = req.user._id;
        if (!profilePicture) {
            return res.status(400).json({ message: "Profile picture is required" });
        }

        // Find the current user to get the old image URL
        const user = await User.findById(userId);
        const oldImageUrl = user.profilePicture;

        // Upload the new image
        const uploadResponse = await cloudinary.uploader.upload(profilePicture);

        // Update user with new image URL
        user.profilePicture = uploadResponse.secure_url;
        await user.save();

        // Delete old image if it exists
        if (oldImageUrl) {
            // Extract public_id from URL
            const segments = oldImageUrl.split('/');
            const filename = segments[segments.length - 1];
            const publicId = filename.split('.')[0]; // remove extension

            await cloudinary.uploader.destroy(publicId);
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error updating profile picture:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



export const authCheck = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.error("Error during auth check:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}