import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { z } from 'zod';

import { GoogleGenerativeAI } from '@google/generative-ai';

import { Database } from 'bun:sqlite';
import { debug } from 'node:util';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY not found in environment variables.');
  process.exit(1);
}

type Show = {
  Name: string;
  Year: string;
  IMDB: string | null;
  Wikpedia: string | null;
  Summary: string | null;
};

const db = new Database('shows.db', {
  readonly: true,
});

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

console.log('Connected to shows.db');

const FilterSchema = z.object({
  keywords: z.array(z.string()),
  year: z.number().optional(),
  minYear: z.number().optional(),
  maxYear: z.number().optional(),
});

type SearchFilters = z.infer<typeof FilterSchema>;

async function getFiltersFromKeywords(input: string): Promise<SearchFilters | null> {
  const prompt = `
    You are a backend assistant that extracts structured search filters
    from user input for querying a TV shows database.

    Respond ONLY with a compact JSON object and NOTHING else.
    Do NOT include markdown (like \`\`\`json) or any explanations.

    Output JSON must match this schema:
    {
      "keywords": string[],
      "year"?: number,
      "minYear"?: number,
      "maxYear"?: number
    }

    User query: "${input}"
  `.trim();

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    const parsed = JSON.parse(raw);
    const validation = FilterSchema.safeParse(parsed);

    if (!validation.success) {
      console.error('❌ Validation error:', validation.error.format());
      return null;
    }

    return validation.data;
  } catch (err) {
    console.error('❌ Failed to get filters:', err);
    return null;
  }
}

const filters = await getFiltersFromKeywords('detective comedy from 2014');

async function main() {
  const rl = readline.createInterface({ input, output });
  console.log("TV Show Search CLI (type 'exit' to quit)");

  while (true) {
    const input = await rl.question('\nEnter search keywords: ');
    if (input.trim().toLowerCase() === 'exit') break;

    if (!input.trim()) continue;

    const filters = await getFiltersFromKeywords(input);

    const sql = buildSqlFromFilters(filters);
    try {
      const results = db.query(sql).all() as Show[];

      displayResults(results);
    } catch (err) {
      console.error('SQL execution failed:', err);
    }
  }

  db.close();

  console.log('Database closed.');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  db.close();
  process.exit(1);
});
