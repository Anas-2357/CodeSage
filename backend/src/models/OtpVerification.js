import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    name: String,
    password: String,
    createdAt: { type: Date, default: Date.now, expires: 300 },
});

export default mongoose.model("OtpVerification", otpSchema);
