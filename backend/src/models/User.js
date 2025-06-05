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
        credits: {
            type: Number,
            required: true,
        },
        repos: {
            type: Array,
            required: false,
        },
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
