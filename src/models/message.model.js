import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },  
  content: { type: String },
  media: { type: String },
  type: {
    type: String,
    enum: ["text", "image", "audio"],
    default: "text",
  },
}, { timestamps: true });

messageSchema.pre("save", function (next) {
  if (!this.receiverId && !this.groupId) {
    return next(new Error("Message must have either receiverId or groupId"));
  }
  if (this.receiverId && this.groupId) {
    return next(new Error("Message cannot have both receiverId and groupId"));
  }
  next();
});

const Message = mongoose.model("Message", messageSchema);
export default Message;
