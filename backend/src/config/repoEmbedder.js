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
    "node_modules",
    ".git",
    "dist",
    "build",
    "out",
    ".next",
    "coverage",
    ".turbo",
    ".vscode",
    ".idea",
    ".cache",
    ".vercel",
    ".firebase",
    "android",
    "ios",
    ".expo",
    "__pycache__",
    ".pytest_cache",
    ".venv",
    "env",
    "tmp",
    "logs",
    "bin",
];

export async function ingestRepo(
    userId,
    repoUrl,
    pinecone,
    indexName,
    spaceName,
    dryRun = true
) {
    let tempDir;
    let totalTokens = 0;
    let totalLines = 0;
    let codeFiles = [];
    let allChunks = [];
    let embeddedChunks = [];
    let vectors = [];
    try {
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

        tempDir = path.join(os.tmpdir(), `repo-${uuidv4()}`);
        const git = simpleGit();

        console.time(`git-clone-${tempDir}`);
        await git.clone(repoUrl, tempDir, ["--depth", "1", "--single-branch"]);
        console.timeEnd(`git-clone-${tempDir}`);

        console.time(`read-files-${tempDir}`);
        codeFiles = getAllCodeFiles(tempDir);
        console.timeEnd(`read-files-${tempDir}`);

        // First pass: collect chunks and count total tokens

        console.time(`collect chunks-${tempDir}`);
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
        console.timeEnd(`collect chunks-${tempDir}`);

        let availableTokens = Number(user.tokens.toFixed(0));

        if (dryRun) {
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
        console.time(`generate-embeddings-${tempDir}`);
        const limit = pLimit(5);
        const embeddingPromises = allChunks.map((chunk) =>
            limit(() => {
                if (!chunk.text || chunk.text.trim() === "") {
                    console.warn(`Empty chunk: ${chunk.id}`);
                    return null;
                }

                const tokenLength = enc.encode(chunk.text).length;
                if (tokenLength > 8191) {
                    console.warn(
                        `Oversized chunk skipped: ${chunk.id} with ${tokenLength} tokens`
                    );
                    return null;
                }

                return generateEmbeddings([chunk.text]).then((embeddings) => ({
                    ...chunk,
                    embedding: embeddings[0],
                }));
            })
        );

        embeddedChunks = await Promise.all(embeddingPromises);
        console.timeEnd(`generate-embeddings-${tempDir}`);

        vectors = embeddedChunks
            .filter((chunk) => chunk !== null)
            .map((chunk) => ({
                id: chunk.id,
                values: chunk.embedding,
                metadata: {
                    filePath: sanitizeForPinecone(chunk.filePath),
                    chunk: sanitizeForPinecone(chunk.text),
                    startLine: sanitizeForPinecone(chunk.startLine),
                    endLine: sanitizeForPinecone(chunk.endLine),
                    repoUrl,
                },
            }));

        const nameSpace = `${spaceName}-${uuidv4()}`;

        // Upsert in vector DB
        console.time(`Batch and upsert vectors-${tempDir}`);
        await batchUpsert(pinecone, vectors, indexName, nameSpace);
        console.timeEnd(`Batch and upsert vectors-${tempDir}`);

        const repoData = {
            ownerId: userId,
            nameSpace,
            repoUrl,
            isPublic: false,
            spaceName,
            totalFiles: codeFiles.length,
            chunksPushed: vectors.length,
            totalLines,
        };

        await createAndUpserRepoInDb(repoData);

        user.tokens = user.tokens - totalTokens;
        await user.save();
        availableTokens = Number(user.tokens.toFixed(0));

        return {
            message: `✅ Ingested ${codeFiles.length} files from repo.`,
            totalTokens,
            availableTokens,
            totalLines,
        };
    } catch (err) {
        if (dryRun) {
            return {
                message: `Dry run failed`,
                error: err.message,
            };
        }
        return {
            message: `Repo injection failed`,
            error: err.message,
        };
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
        global.gc?.();
        codeFiles.length = 0;
        allChunks.length = 0;
        embeddedChunks.length = 0;
        vectors.length = 0;
    }
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

async function batchUpsert(
    pinecone,
    vectors,
    indexName,
    namespace,
    batchSize = 100
) {
    for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await upsertVectors(pinecone, batch, indexName, namespace);
    }
}

export function sanitizeForPinecone(input) {
    if (typeof input !== "string") return input;
    return input
        .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, "")
        .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "");
}
