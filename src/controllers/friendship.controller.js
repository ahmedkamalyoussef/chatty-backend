import { getReceiverSocketId, io } from "../lib/socket.js";
import Friendship from "../models/friendship.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

export const sendFriendRequest = async (req, res) => {
  try {
    const requesterId = req.user._id;
    const { recipientId } = req.params;

    if (requesterId.toString() === recipientId.toString()) {
      return res.status(400).json({ error: "You cannot send a request to yourself" });
    }

    // شوف لو فيه علاقة قديمة بين الاتنين
    const existing = await Friendship.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existing) {
      if (existing.status === "pending") {
        return res.status(400).json({ error: "Friend request is already pending between you two" });
      }
      if (existing.status === "accepted") {
        return res.status(400).json({ error: "You are already friends" });
      }
    }

    const friendship = await Friendship.create({
      requester: requesterId,
      recipient: recipientId,
      status: "pending",
    });

    const receiverSocketId = getReceiverSocketId(recipientId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newFriendRequest', {
        type: 'friendRequest',
        from: requesterId,
        friendship: friendship
      });
    }

    res.status(200).json(friendship);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const recipientId = req.user._id;
    const { requesterId } = req.params;

    const friendship = await Friendship.findOneAndUpdate(
      { requester: requesterId, recipient: recipientId, status: "pending" },
      { status: "accepted" },
      { new: true }
    );

    if (!friendship) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    const receiverSocketId = getReceiverSocketId(requesterId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("friendRequestAccepted", {
        recipient: friendship.recipient,
        requester: friendship.requester,
      });
    }

    const recipientSocketId = getReceiverSocketId(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("friendRequestAccepted", {
        recipient: friendship.recipient,
        requester: friendship.requester,
      });
    }

    res.status(200).json(friendship);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const rejectFriendRequest = async (req, res) => {
  try {
    const recipientId = req.user._id;
    const { requesterId } = req.params;

    const deleted = await Friendship.findOneAndDelete({
      requester: requesterId,
      recipient: recipientId,
      status: "pending"
    });

    if (!deleted) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    res.status(200).json({ message: "Friend request rejected and deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    const friendships = await Friendship.find({
      $or: [
        { requester: userId, status: "accepted" },
        { recipient: userId, status: "accepted" }
      ]
    }).populate("requester recipient", "firstName lastName handle profilePicture");

    const friends = friendships.map(f =>
      f.requester._id.toString() === userId.toString() ? f.recipient : f.requester
    );

    res.status(200).json(friends);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


export const searchFriend = async (req, res) => {
  try {
    const meId = req.user?._id;
    const rawQ = (req.params.handleToSearch || req.query.q || "").trim();
    if (!rawQ) return res.status(400).json({ error: "query is required" });

    const q = rawQ.replace(/^@/, "");
    const pattern = new RegExp(q, "i");

    // نجيب المستخدمين اللي مش أنا
    const users = await User.aggregate([
      { $match: { _id: { $ne: new mongoose.Types.ObjectId(meId) } } },
      {
        $addFields: {
          fullName: {
            $concat: [
              { $ifNull: ["$firstName", ""] },
              " ",
              { $ifNull: ["$lastName", ""] },
            ],
          },
        },
      },
      {
        $match: {
          $or: [
            { handle: { $regex: pattern } },
            { firstName: { $regex: pattern } },
            { lastName: { $regex: pattern } },
            { fullName: { $regex: pattern } },
          ],
        },
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          handle: 1,
          profilePicture: 1,
        },
      },
      { $limit: 20 },
    ]);

    // لو مفيش مستخدمين نرجع فاضي
    if (users.length === 0) {
      return res.status(200).json([]);
    }

    // نجيب العلاقات (Friendship) مع الناس دول
    const userIds = users.map((u) => u._id);
    const friendships = await Friendship.find({
      $or: [
        { requester: meId, recipient: { $in: userIds } },
        { requester: { $in: userIds }, recipient: meId },
      ],
    });

    // نعمل map بالstatus
    const results = users.map((user) => {
      const relation = friendships.find(
        (f) =>
          f.requester.toString() === meId.toString() &&
          f.recipient.toString() === user._id.toString()
      ) ||
      friendships.find(
        (f) =>
          f.recipient.toString() === meId.toString() &&
          f.requester.toString() === user._id.toString()
      );

      let status = "none";
      if (relation) {
        if (relation.status === "accepted") {
          status = "friend";
        } else if (relation.status === "pending") {
          if (relation.requester.toString() === meId.toString()) {
            status = "pending_sent";
          } else {
            status = "pending_received";
          }
        }
      }

      return { ...user, status };
    });

    return res.status(200).json(results);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
};


export const getFriendRequests = async (req, res) => {
  try {
    const meId = req.user._id;

    const requests = await Friendship.find({ recipient: meId, status: "pending" })
      .populate("requester", " _id firstName lastName handle profilePicture")

    return res.status(200).json({ requests, cout: requests.length });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

deleteFriend: async (friendId) => {
  set({ loading: true });
  try {
    await axiosInstance.delete(`/friends/${friendId}`);
    set((state) => ({
      friends: state.friends.filter((f) => f._id !== friendId),
      messages: state.messages.filter(
        (m) => m.sender._id !== friendId && m.receiver._id !== friendId
      ),
    }));
    toast.success("Friend deleted");
  } catch (err) {
    toast.error(err.response?.data?.error || "Failed to delete friend");
  } finally {
    set({ loading: false });
  }
}
