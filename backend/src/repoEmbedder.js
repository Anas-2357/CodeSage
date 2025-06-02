import simpleGit from 'simple-git';
import fs from 'fs';
import path from 'path';
import { generateEmbedding } from './openaiClient.js';
import { upsertVectors } from './pineconeClient.js';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

export async function ingestRepo(repoUrl, pineconeClient) {
  const tempDir = path.join(os.tmpdir(), `repo-${uuidv4()}`);
  const git = simpleGit();

  console.log('Cloning repo...');
  await git.clone(repoUrl, tempDir);

  console.log('Reading code files...');
  const codeFiles = getAllCodeFiles(tempDir);

  for (const file of codeFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const chunks = splitIntoChunks(content);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);
      await upsertVectors(pineconeClient, [
        {
          id: `${file}::chunk-${i}`,
          values: embedding,
          metadata: {
            filePath: file.replace(tempDir, ''),
            chunk,
            repoUrl,
          },
        },
      ]);
    }
  }

  return { message: `Ingested ${codeFiles.length} files from repo.` };
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

function splitIntoChunks(text, maxLen = 1000) {
  const lines = text.split('\n');
  const chunks = [];
  let chunk = [];

  for (const line of lines) {
    chunk.push(line);
    if (chunk.join('\n').length >= maxLen) {
      chunks.push(chunk.join('\n'));
      chunk = [];
    }
  }
  if (chunk.length) chunks.push(chunk.join('\n'));
  return chunks;
}
