import { getReceiverSocketId, io } from "../lib/socket.js";
import Friendship from "../models/friendship.model.js";

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
            io.to(receiverSocketId).emit('newFriendRequest',newMessage);
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
            io.to(receiverSocketId).emit('acceptingFriendRequest',newMessage);
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
    const userId = req.user._id;
    const { handleToSearch } = req.params;

    // Search by handle (partial + case-insensitive)
    const friendsSearch = await User.find({
      handle: { $regex: handleToSearch, $options: "i" }
    }).select("_id firstName lastName handle profilePicture");

    res.status(200).json(friendsSearch);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
