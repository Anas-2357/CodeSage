import mongoose from "mongoose";

const repoSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    nameSpace: {
      type: String,
      required: true,        
    },
    repoUrl: {
      type: String,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    spaceName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    totalFiles: Number,
    chunksPushed: Number
  },
  { timestamps: true }
);

export default mongoose.model("Repo", repoSchema);
