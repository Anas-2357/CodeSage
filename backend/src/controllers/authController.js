import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import OtpVerification from "../models/OtpVerification.js";
import nodemailer from "nodemailer";

const JWT_SECRET = process.env.JWT_SECRET;

export const sendOtp = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required." });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format." });
        }

        if (password.length < 8) {
            return res
                .status(400)
                .json({ error: "Password must be at least 8 characters." });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await OtpVerification.deleteMany({ email });
        await OtpVerification.create({
            email,
            otp,
            name,
            password: hashedPassword,
        });

        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            to: email,
            subject: "Your OTP for Signup",
            html: `<p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`,
        });

        res.status(200).json({ message: "OTP sent to email." });
    } catch (err) {
        console.error("Send OTP error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res
                .status(400)
                .json({ error: "Email and OTP are required." });
        }

        const record = await OtpVerification.findOne({ email });
        if (!record || record.otp !== otp) {
            return res.status(400).json({ error: "Invalid or expired OTP." });
        }

        const { name, password } = record;

        const newUser = await User.create({
            name,
            email,
            password,
            tokens: 2000,
            repos: [],
        });

        await OtpVerification.deleteOne({ _id: record._id });

        res.status(201).json({
            message: "Email verified and user registered.",
        });
    } catch (err) {
        console.error("Verify OTP error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ error: "Email and password required." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, {
            expiresIn: "7d",
        });

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
