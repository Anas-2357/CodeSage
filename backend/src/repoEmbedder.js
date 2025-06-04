import { encoding_for_model } from "tiktoken";
import pLimit from "p-limit";
import simpleGit from "simple-git";
import fs from "fs";
import path from "path";
import { generateEmbeddings } from "./openaiEmbeddingsClient.js";
import { upsertVectors } from "./pineconeClient.js";
import os from "os";
import { v4 as uuidv4 } from "uuid";

const enc = encoding_for_model("text-embedding-3-small");

export async function ingestRepo(repoUrl, pineconeClient, indexName) {
    const tempDir = path.join(os.tmpdir(), `repo-${uuidv4()}`);
    const git = simpleGit();

    console.log("Cloning repo...");
    await git.clone(repoUrl, tempDir);

    console.log("Reading code files...");
    const codeFiles = getAllCodeFiles(tempDir);
    const totalFiles = codeFiles.length;

    const limit = pLimit(100);
    let processedCount = 0;

    await Promise.all(
        codeFiles.map((file) =>
            limit(async () => {
                const content = fs.readFileSync(file, "utf-8");
                const chunks = splitIntoChunks(content);

                const embeddings = await generateEmbeddings(
                    chunks.map((c) => c.text)
                );

                const vectors = embeddings.map((embedding, i) => ({
                    id: `${file}::chunk-${i}`,
                    values: embedding,
                    metadata: {
                        filePath: file.replace(tempDir, ""),
                        chunk: chunks[i].text,
                        startLine: chunks[i].startLine,
                        endLine: chunks[i].endLine,
                        repoUrl,
                    },
                }));

                await upsertVectors(pineconeClient, vectors, indexName);

                processedCount++;
                console.log(
                    `✅ Processed ${processedCount} / ${totalFiles} files`
                );
            })
        )
    );

    return { message: `Ingested ${totalFiles} files from repo.` };
}

function getAllCodeFiles(dir, allFiles = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            getAllCodeFiles(fullPath, allFiles);
        } else if (
            entry.isFile() &&
            /\.(js|ts|jsx|tsx|py|java|md|json|html|css)$/.test(entry.name)
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
    const lineStarts = [0]; // stores char index of each line start
    for (let i = 0; i < text.length; i++) {
        if (text[i] === "\n") {
            lineStarts.push(i + 1);
        }
    }

    // Helper: get line number from char index using binary search
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
                    return mid + 1; // line numbers start at 1
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
