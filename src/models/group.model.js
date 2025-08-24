import mongoose from "mongoose";
import { randomBytes } from "crypto";

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  groupPicture: {
    type: String,
    default: "https://static.vecteezy.com/system/resources/previews/024/983/914/large_2x/simple-user-default-icon-free-png.png"
  },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: { type: String, enum: ["member", "admin"], default: "member" },
    }
  ],
  inviteToken: { type: String, unique: true },
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

// Generate invite token if not exists
groupSchema.pre("save", function (next) {
  if (!this.inviteToken) {
    this.inviteToken = randomBytes(16).toString("hex");
  }
  next();
});

// ✅ Prevent duplicate members in the same group
groupSchema.index(
  { _id: 1, "members.userId": 1 },
  { unique: true, partialFilterExpression: { "members.userId": { $exists: true } } }
);

const Group = mongoose.model("Group", groupSchema);
export default Group;
