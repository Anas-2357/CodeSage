import Repo from "../models/Repo.js";

export async function createAndUpserRepoInDb(repoData) {
  const newRepo = new Repo(repoData);
  return await newRepo.save();
}

export async function getRepoById(id) {
  return await Repo.findById(id);
}

