
import Message from '../models/message.model.js';

export const getMessages = async (req, res) => {
    const userId = req.userId;
    const otherUserId = req.params.userID;

    try {
        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: otherUserId },
                { sender: otherUserId, receiver: userId }
            ]
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving messages", error });
    }
};