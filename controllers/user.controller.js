
import User from '../models/user.model.js';


export const getAllUsers = async (req, res) => {
  const users = await User.find({}, '_id username displayName lastSeen');
  res.json(users);
}