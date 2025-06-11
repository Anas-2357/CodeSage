import { encoding_for_model } from "tiktoken";
import pLimit from "p-limit";
import simpleGit from "simple-git";
import fs from "fs";
import path from "path";
import { generateEmbeddings } from "./openaiEmbeddingsClient.js";
import { upsertVectors } from "./pineconeClient.js";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import User from "../models/User.js";
import { createAndUpserRepoInDb } from "../services/repoService.js";
import Repo from "../models/Repo.js";

const enc = encoding_for_model("text-embedding-3-small");

const IGNORE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  '.next',
  'coverage',
  '.turbo',
  '.vscode',
  '.idea',
  '.cache',
  '.vercel',
  '.firebase',
  'android',
  'ios',
  '.expo',
  '__pycache__',
  '.pytest_cache',
  '.venv',
  'env',
  'tmp',
  'logs',
  'bin'
];

export async function ingestRepo(
    userId,
    repoUrl,
    pinecone,
    indexName,
    spaceName,
    dryRun = true
) {
    const user = await User.findById(userId);

    const [userRepo, publicRepo] = await Promise.all([
        Repo.findOne({ ownerId: userId, spaceName }),
        Repo.findOne({ isPublic: true, spaceName }),
    ]);

    if (!dryRun && (userRepo || publicRepo)) {
        return {
            message: `A space with name ${spaceName} alreay exists`,
        };
    }

    const tempDir = path.join(os.tmpdir(), `repo-${uuidv4()}`);
    const git = simpleGit();

    console.time("git-clone");
    await git.clone(repoUrl, tempDir);
    console.timeEnd("git-clone");

    console.time("read-files");
    const codeFiles = getAllCodeFiles(tempDir);
    console.timeEnd("read-files");

    const allChunks = [];

    let totalTokens = 0;
    let totalLines = 0;

    // First pass: collect chunks and count total tokens
    for (const file of codeFiles) {
        const content = fs.readFileSync(file, "utf-8");
        const chunks = splitIntoChunks(content);
        const linesInFile = content.split("\n").length;
        totalLines += linesInFile;

        const tokensInFile = chunks.reduce(
            (sum, chunk) => sum + enc.encode(chunk.text).length,
            0
        );
        totalTokens += tokensInFile;

        chunks.forEach((chunk, i) => {
            allChunks.push({
                id: `${file}::chunk-${i}`,
                text: chunk.text,
                startLine: chunk.startLine,
                endLine: chunk.endLine,
                filePath: file.replace(tempDir, ""),
            });
        });
    }

    var availableTokens = Number(user.tokens.toFixed(0));

    if (dryRun) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        return {
            message: "✅ Dry run complete. Enough tokens available.",
            estimatedTokenCount: Math.ceil(totalTokens / 500),
            availableTokens,
            totalFiles: codeFiles.length,
            totalLines,
        };
    }

    totalTokens = Number((totalTokens / 500).toFixed(0));

    // Token quota check
    if (totalTokens > availableTokens) {
        return {
            message: "❌ Not enough tokens available to process this repo.",
            requiredTokens: totalTokens,
            availableTokens,
            totalLines,
        };
    }

    // Proceed with embeddings
    console.time("generate-embeddings");
    const limit = pLimit(100);
    const embeddingPromises = allChunks.map((chunk) =>
        limit(() =>
            generateEmbeddings([chunk.text]).then((embeddings) => ({
                ...chunk,
                embedding: embeddings[0],
            }))
        )
    );

    const embeddedChunks = await Promise.all(embeddingPromises);
    console.timeEnd("generate-embeddings");

    const vectors = embeddedChunks.map((chunk) => ({
        id: chunk.id,
        values: chunk.embedding,
        metadata: {
            filePath: chunk.filePath,
            chunk: chunk.text,
            startLine: chunk.startLine,
            endLine: chunk.endLine,
            repoUrl,
        },
    }));

    const nameSpace = `${spaceName}-${uuidv4()}`;

    // Upsert in vector DB
    console.time("generate-embeddings");
    await upsertVectors(pinecone, vectors, indexName, nameSpace);
    console.timeEnd("generate-embeddings");

    const repoData = {
        ownerId: userId,
        nameSpace,
        repoUrl,
        isPublic: false,
        spaceName,
        totalFiles: codeFiles.length,
        chunksPushed: embeddedChunks.length,
        totalLines,
    };

    await createAndUpserRepoInDb(repoData);

    user.tokens = user.tokens - totalTokens;
    await user.save();
    availableTokens = Number(user.tokens.toFixed(0));
    fs.rmSync(tempDir, { recursive: true, force: true });

    return {
        message: `✅ Ingested ${codeFiles.length} files from repo.`,
        totalTokens,
        availableTokens,
        totalLines,
    };
}

function getAllCodeFiles(dir, allFiles = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (IGNORE_DIRS.includes(entry.name)) continue;
            getAllCodeFiles(fullPath, allFiles);
        } else if (
            entry.isFile() &&
            /\.(js|ts|jsx|tsx|py|java|kt|rb|go|rs|cpp|cc|cxx|c|h|php|swift|cs|dart|json|ya?ml|md|txt|rst|html|css|scss|sass|vue|env|lock|config\.\w+)$/.test(
                entry.name
            )
        ) {
            allFiles.push(fullPath);
        }
    }
    return allFiles;
}

export function splitIntoChunks(text, maxTokens = 1000, overlap = 200) {
    const tokens = enc.encode(text);
    const chunks = [];

    // Build mapping of char index to line number
    const lineStarts = [0];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === "\n") {
            lineStarts.push(i + 1);
        }
    }

    function getLineNumber(charIndex) {
        let low = 0,
            high = lineStarts.length - 1;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            if (lineStarts[mid] <= charIndex) {
                if (
                    mid === lineStarts.length - 1 ||
                    lineStarts[mid + 1] > charIndex
                ) {
                    return mid + 1;
                }
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return 1;
    }

    let start = 0;
    while (start < tokens.length) {
        const end = Math.min(start + maxTokens, tokens.length);

        const startCharIndex = enc.decode(tokens.slice(0, start)).length;
        const endCharIndex = enc.decode(tokens.slice(0, end)).length;

        const chunkText = text.slice(startCharIndex, endCharIndex);
        const startLine = getLineNumber(startCharIndex);
        const endLine = getLineNumber(endCharIndex);

        chunks.push({
            text: chunkText,
            startLine,
            endLine,
        });

        start += maxTokens - overlap;
    }

    return chunks;
}
