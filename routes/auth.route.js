import express from "express";
const router = express.Router();
import { Login, Register } from "../controllers/auth.controller.js";

// Routes

router.post("/login", Login);

router.post("/register", Register);

// Export the router
// module.exports = router;

export default router;
