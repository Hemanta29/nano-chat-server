import express from "express";

import { authMiddleWare } from "../middleware/authMiddleware.js";
import { getMessages } from "../controllers/message.controller.js";

const router = express.Router();

// Routes

router.get("/:userID", authMiddleWare, getMessages);

export default router;
