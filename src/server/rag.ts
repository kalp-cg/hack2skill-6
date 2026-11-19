import fs from 'node:fs';
import path from 'node:path';

export interface KnowledgeChunk {
  id: string;
  sourceName: string;
  heading: string;
  content: string;
  tokens: Set<string>;
}

let cachedChunks: KnowledgeChunk[] | null = null;

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3)
  );
}

export function loadKnowledgeBase(kbDir = path.resolve(process.cwd(), 'knowledge-base')): KnowledgeChunk[] {
  if (cachedChunks) return cachedChunks;

  const chunks: KnowledgeChunk[] = [];
  if (!fs.existsSync(kbDir)) return chunks;

  const files = fs.readdirSync(kbDir).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const fullPath = path.join(kbDir, file);
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const sourceLine = raw.split('\n').find((l) => l.startsWith('Source:'));
    const sourceName = sourceLine ? sourceLine.replace(/^Source:\s*/, '').trim() : file;

    const sections = raw.split(/\n##\s+/);
    sections.forEach((sec, idx) => {
      const lines = sec.trim().split('\n');
      const heading = lines[0]?.replace(/^#\s*/, '').trim() || file;
      const content = lines.slice(1).join('\n').trim();
      if (content.length > 20) {
        chunks.push({
          id: `${file}#${idx}`,
          sourceName,
          heading,
          content,
          tokens: tokenize(`${heading} ${content}`),
        });
      }
    });
  }

  cachedChunks = chunks;
  return chunks;
}

export function retrieveKnowledge(query: string, topK = 3): KnowledgeChunk[] {
  const chunks = loadKnowledgeBase();
  if (chunks.length === 0) return [];

  const qTokens = tokenize(query);
  const scored = chunks.map((chunk) => {
    let overlap = 0;
    for (const tok of qTokens) {
      if (chunk.tokens.has(tok)) overlap += 1;
    }
    return { chunk, score: overlap / Math.sqrt(Math.max(1, chunk.tokens.size)) };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((s) => s.chunk);
}
