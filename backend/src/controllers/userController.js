import User from "../models/User.js";

export const pushUrl = async (req, res) => {
    try {
        const { newUrl } = req.body;

        if (typeof newUrl !== 'string') {
            return res.status(400).json({ error: "newUrl must be a string" });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.repos.push(newUrl);
        await user.save();

        res.status(200).json({ message: "URL updated successfully", repos: user.repos });
    } catch (err) {
        console.error("Push URL error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
