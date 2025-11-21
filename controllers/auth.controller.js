import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/user.model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Login controller

export const Login = async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
        res.cookie('token', token, { httpOnly: true });
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName,
                avatar: user.avatar,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Register controller

export const Register = async (req, res) => {
    const { username, password, displayName } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            passwordHash: hashedPassword,
            displayName,
        });
        await newUser.save();

        const token = jwt.sign({ id: newUser._id, username: newUser.username}, JWT_SECRET);
        res.cookie('token', token, { httpOnly: true });
        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                displayName: newUser.displayName,
                avatar: newUser.avatar,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Logout controller

export const Logout = (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logout successful' });
}   