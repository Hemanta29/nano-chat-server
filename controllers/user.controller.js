
import User from '../models/user.model.js';
import Message from '../models/message.model.js';


export const getAllUsers = async (req, res) => {
  const users = await User.find({}, '_id username displayName lastSeen');
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const latestMessage = await Message.findOne({
      $or: [{ sender: user._id }, { receiver: user._id }]
    })
      .sort({ createdAt: -1 })

    user._doc.lastMessage = latestMessage;
    // console.log(user);
  }

  res.json(users);
}