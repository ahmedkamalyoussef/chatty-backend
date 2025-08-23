import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { getFriends,getMessages,sendMessage,isDoingSomething } from '../controllers/message.controller.js';
const router = express.Router();

router.get('/friends',protect,getFriends);
router.get('/:userToChatId', protect, getMessages);
router.post('/send/:id', protect, sendMessage);
router.post('/doSomeThing/:id',protect, isDoingSomething);
export default router;