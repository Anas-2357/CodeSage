import Repo from "../models/Repo.js";

export const getUserSpaces = async (req, res) => {
    try {
        const userId = req.user?.id;

        var spaces = await Repo.find({ userId });
        spaces = [...spaces, ...(await Repo.find({ isPublic: true }))];

        const formatted = spaces.map((space) => ({
            repoUrl: space.repoUrl,
            spaceName: space.spaceName,
            isPublic: space.isPublic,
            spaceId: space._id,
        }));

        return res.status(200).json({ spaces: formatted });
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
