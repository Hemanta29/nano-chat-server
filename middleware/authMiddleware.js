

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Authentication middleware

export const authMiddleWare = (req, res, next) => {
    // console.log("Auth middleware triggered");
    // console.log("Cookies:", req.headers.cookie.split("=")[1]);
    // console.log("Headers:", req.headers.authorization.split(" ")[1]);

    const token = req.headers.cookie?.split("=")[1] || req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log("Decoded token:", decoded);
        req.userId = decoded.id;
        req.userName = decoded.username;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}