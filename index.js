import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Server } from "socket.io";
import http from "http";
// import cors from "cors";
import jwt from "jsonwebtoken";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import messageRoutes from "./routes/message.route.js";
import Message from "./models/message.model.js";
import User from "./models/user.model.js";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const port = process.env.PORT || 3000;
const mongoURI = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const app = express();

// Enable CORS for all origins, methods, and headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Or specify a specific origin like 'http://localhost:3000'
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Middleware
// app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes

app.use("/api", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

// Basic routes

app.get("/", (req, res) => {
  res.send("Chat server is running!");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const server = http.createServer(app);
// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const onlineUsers = new Map();

io.use((socket, next) => {
  // console.log("Socket auth middleware triggered");
  // console.log("Token:", socket.handshake.auth.token);

  const token = socket.handshake.auth.token;
  // console.log("Socket auth token:", token);

  if (!token) {
    return next(new Error("Authentication error"));
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    socket.userId = payload.id;
    socket.userName = payload.username;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id, "UserName:", socket.userName);
  onlineUsers.set(socket.userId, socket.id);
  // console.log("Online users:", onlineUsers);

  // Broadcast online users to all connected clients
  io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  io.emit("presence", { userId: socket.userId,userName: socket.userName, online: true });

  // Fetch and emit undelivered messages for the connected user

  Message.find({ receiver: socket.userId, delivered: false })
    .then((undeliveredMessages) => {
      undeliveredMessages.forEach((message) => {
        socket.emit("newMessage", message);
        message.delivered = true;
        message.save();
      });
    })
    .catch((err) => {
      console.error("Error fetching undelivered messages:", err);
    });

  socket.on("typing", ({ to, isTyping }) => {
    const destSocket = onlineUsers.get(to);
    if (destSocket)
      io.to(destSocket).emit("typing", { sender: socket.userId, isTyping });
  });

  socket.on("message", async ({ receiver, text }) => {
    const msg = await Message.create({
      sender: socket.userId,
      receiver,
      content: text,
    });

    const destSocket = onlineUsers.get(receiver);
    const msgPayload = {
      _id: msg._id,
      sender: socket.userId,
      receiver,
      content: text,
      createdAt: msg.createdAt,
    };
    console.log("Message payload:", msgPayload);
    console.log("Destination socket:", destSocket);

    if (destSocket) {
      io.to(destSocket).emit("message", msgPayload);
      msg.delivered = true;
      await msg.save();
    }
    socket.emit("message:sent", msgPayload); // ack back to sender
  });

  socket.on("markRead", async ({ messageId }) => {
    const m = await Message.findById(messageId);
    if (m) {
      m.read = true;
      await m.save();
      const senderSocket = onlineUsers.get(String(m.sender));
      if (senderSocket) io.to(senderSocket).emit("message:read", { messageId });
    }
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);
    onlineUsers.delete(socket.userId);
    console.log("Online users:", onlineUsers);
    io.emit("presence", {
      userId: socket.userId,
      online: false,
      lastSeen: new Date(),
    });
    await User.findByIdAndUpdate(socket.userId, { lastSeen: new Date() });
  });

  socket.on("logout", async (userId) => {
    console.log("User logged out:", userId);
    const userSocketId = onlineUsers.get(userId);
    console.log("User socket ID:", userSocketId);
    io.emit("presence", {
      userId: userId,
      online: false,
      lastSeen: new Date(),
    });
    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });

    
    if (userSocketId) {
      onlineUsers.delete(userId);
      io.sockets.sockets.get(userSocketId)?.disconnect();
    }
  });

  socket.on("connect_error", (err) => {
    console.error("Socket error:", err);
  });

  // Additional socket event handlers can be added here
});

// Connect to MongoDB and start the server

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("Connected to MongoDB");

    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });
