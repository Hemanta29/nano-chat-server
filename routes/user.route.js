
import express from 'express';
const router = express.Router();

import { authMiddleWare } from '../middleware/authMiddleware.js';
import { getAllUsers } from '../controllers/user.controller.js';

// Routes


router.get('/', authMiddleWare, getAllUsers);

export default router;