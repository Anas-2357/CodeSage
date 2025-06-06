import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            unique: true,
            required: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        tokens: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
