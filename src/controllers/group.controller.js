import Group from '../models/group.model.js';
import Message from "../models/message.model.js";
import { randomBytes } from "crypto";

import cloudinary from '../lib/cloudinary.js';

export const createGroup = async (req, res) => {
  try {
    const { name, description, members, groupPicture } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    let uploadedImage = null;

    if (groupPicture) {
      const uploadResponse = await cloudinary.uploader.upload(groupPicture, {
        folder: "groups",
      });
      uploadedImage = uploadResponse.secure_url;
    }

    const group = new Group({
      name,
      description,
      admin: req.user._id,
      groupPicture: uploadedImage,
      members: [
        { userId: req.user._id, role: "admin" },
        ...(members?.map((m) => ({ userId: m, role: "member" })) || []),
      ],
    });

    await group.save();
    res.status(201).json(group);
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const addMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userIds } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    const uniqueUserIds = [...new Set(userIds.map(id => id.toString()))];

    uniqueUserIds.forEach(uid => {
      if (!group.members.some(m => m.userId.equals(uid))) {
        group.members.push({ userId: uid, role: "member" });
      }
    });

    await group.save();
    res.status(200).json({
      message: "Members added successfully",
      inviteToken: group.inviteToken
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


export const removeMember = async (req, res) => {
  const { groupId, userId } = req.params;
  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ message: "Group not found" });
  if (group.admin.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only admin can remove members" });
  }
  group.members = group.members.filter(m => m.userId.toString() !== userId);
  await group.save();
  res.status(200).json(group);
};

export const getGroupInviteLink = async (req, res) => {
  const { groupId } = req.params;
  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ message: "Group not found" });
  if (group.admin.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only admin can get invite link" });
  }
  const inviteUrl = `${process.env.FRONTEND_URL}/join-group/${group.inviteToken}`;
  res.status(200).json({ inviteUrl });
};

export const regenerateInviteLink = async (req, res) => {
  const { groupId } = req.params;
  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ message: "Group not found" });
  if (group.admin.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only admin can regenerate link" });
  }
  group.inviteToken = randomBytes(16).toString("hex");
  await group.save();
  const inviteUrl = `${process.env.FRONTEND_URL}/join-group/${group.inviteToken}`;
  res.status(200).json({ inviteUrl });
};

export const joinGroupByInvite = async (req, res) => {
  try {
    const { inviteToken } = req.params;

    const group = await Group.findOne({ inviteToken });
    if (!group) return res.status(404).json({ message: "Invalid invite link" });

    if (group.members.some(m => m.userId.equals(req.user._id))) {
      return res.status(400).json({ message: "Already in group" });
    }

    group.members.push({ userId: req.user._id, role: "member" });
    await group.save();

    res.status(200).json({ message: "Joined group", group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getGroupMessages = async (req, res) => {
  const { groupId } = req.params;
  const messages = await Message.find({ groupId }).populate("senderId", "firstName lastName handle profilePicture");
  if (!messages) return res.status(200).json([]);
  res.status(200).json(messages);
};
export const getMyGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({ "members.userId": userId })
      .populate("admin", "firstName lastName handle profilePicture")
      .populate("members.userId", "firstName lastName handle profilePicture")
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    console.error("Error fetching user groups:", error);
    res.status(500).json({ message: "Error fetching groups" });
  }
}