import express from 'express';
import { login, logout, signup,updateProfilePic,authCheck } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.patch('/update-profile-pic',protect,updateProfilePic)
router.get('/check', protect, authCheck);
export default router;