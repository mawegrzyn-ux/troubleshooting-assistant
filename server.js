import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let dotenv;
try {
  dotenv = require('dotenv');
  dotenv.config();
} catch (err) {
  console.warn('dotenv not found; skipping environment variable loading');
}
import { getTroubleshootingResponse, initStore, detectResolutionIntent } from './troubleshooter.js';
import { translateText, detectLanguage } from './translator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'data', 'troubleshooting.json');

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

async function readData() {
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  try {
    // Chat endpoint
    if (req.method === 'POST' && url.pathname === '/chat') {
      const { message, clarifiedSystem, selectedProblem } = await readJsonBody(req);
      const combined = clarifiedSystem ? `${message} on ${clarifiedSystem}` : message;
      const reset = await detectResolutionIntent(combined);
      let response = { text: '' };
      if (!reset) {
        response = await getTroubleshootingResponse(combined, clarifiedSystem, selectedProblem);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ...response, reset }));
    }

    // Translation endpoint
    if (req.method === 'POST' && url.pathname === '/translate') {
      const { text, targetLang } = await readJsonBody(req);
      const translated = await translateText(text, targetLang);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ text: translated }));
    }

    // Language detection endpoint
    if (req.method === 'POST' && url.pathname === '/detect-language') {
      const { text } = await readJsonBody(req);
      const language = await detectLanguage(text);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ language }));
    }

    // Admin API
    if (url.pathname === '/api/entries' && req.method === 'GET') {
      const data = await readData();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(data));
    }

    if (url.pathname === '/api/entries' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const data = await readData();
      const newEntry = { id: randomUUID(), ...body };
      data.push(newEntry);
      await writeData(data);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(newEntry));
    }

    const entryMatch = url.pathname.match(/^\/api\/entries\/(.+)$/);
    if (entryMatch && req.method === 'PUT') {
      const id = entryMatch[1];
      const body = await readJsonBody(req);
      const data = await readData();
      const idx = data.findIndex(e => e.id === id);
      if (idx === -1) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Entry not found' }));
      }
      data[idx] = { ...body, id };
      await writeData(data);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(data[idx]));
    }

    if (entryMatch && req.method === 'DELETE') {
      const id = entryMatch[1];
      const data = await readData();
      const idx = data.findIndex(e => e.id === id);
      if (idx === -1) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Entry not found' }));
      }
      data.splice(idx, 1);
      await writeData(data);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ id }));
    }

    // Static files
    let filePath = path.join(__dirname, 'frontend', 'dist', url.pathname);
    if (url.pathname === '/' || url.pathname === '') {
      filePath = path.join(__dirname, 'frontend', 'dist', 'index.html');
    }
    try {
      const file = await fs.readFile(filePath);
      res.writeHead(200);
      return res.end(file);
    } catch {
      res.writeHead(404);
      return res.end('Not found');
    }
  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Something went wrong' }));
  }
});

await initStore();
server.listen(3000, () => {
  console.log('Assistant backend + frontend running on port 3000');
});
