import Repo from "../models/Repo.js";
import User from "../models/User.js";

export const getUserSpaces = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        let spaces = await Repo.find({ ownerId: userId, isPublic: false });
        console.log(spaces);
        spaces =[...spaces, ...(await Repo.find({ ownerId: userId, isPublic: true }))];
        console.log(spaces);
        spaces = [...spaces, ...(await Repo.find({ isPublic: true, ownerId: { $ne: userId } }))];
        console.log(spaces);

        const formatted = spaces.map((space) => ({
            repoUrl: space.repoUrl,
            spaceName: space.spaceName,
            isPublic: space.isPublic,
            spaceId: space._id,
        }));

        return res.status(200).json({ spaces: formatted, tokens: Number((user.tokens).toFixed()) });
    } catch (error) {
        console.error("Error fetching user spaces:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getPublicSpaces = async (req, res) => {
    try {
        const spaces = await Repo.find({ isPublic: true });

        const formatted = spaces.map((space) => ({
            repoUrl: space.repoUrl,
            spaceName: space.spaceName,
            isPublic: space.isPublic,
            spaceId: space._id,
        }));

        return res.status(200).json({ spaces: formatted });
    } catch (error) {
        console.error("Error fetching public spaces:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
