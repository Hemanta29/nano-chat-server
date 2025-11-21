
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        displayName: {
            type: String,
        },
        lastSeen: {
            type: Date,
            default: Date.now,
        },
        online: {
            type: Boolean,
            default: false,
        },
        avatar: {
            type: String,
        },
        bio: {
            type: String,
        },
        location: {
            type: String,
        }
    }
);

// module.exports = mongoose.model("User", userSchema);

export default mongoose.model("User", userSchema);