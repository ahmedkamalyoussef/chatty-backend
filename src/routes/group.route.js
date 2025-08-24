import express from "express";
import { protect } from '../middlewares/auth.middleware.js';

import {
  createGroup,
  addMembers,
  getGroupInviteLink,
  joinGroupByInvite,
  regenerateInviteLink,
  removeMember,
  getGroupMessages,
  getMyGroups
} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/", protect, createGroup);

router.post("/:groupId/add-members", protect, addMembers);

router.delete("/:groupId/remove-member/:userId", protect, removeMember);

router.get("/:groupId/invite-link", protect, getGroupInviteLink);

router.put("/:groupId/invite-link", protect, regenerateInviteLink);

router.post("/join/:inviteToken", protect, joinGroupByInvite);

router.get("/:groupId/messages", protect, getGroupMessages);

router.get("/my", protect, getMyGroups);

export default router;
