// Serves the exported web app (dist/) over HTTPS on your local Wi-Fi so a phone
// browser can use the camera for live pose tracking. Phone browsers only allow
// the camera on secure pages, so this makes a self-signed certificate for your
// PC's network addresses (kept in .cert/, not committed).
//
//   npm run phone:web          export the app, then serve it
//   node scripts/serve-https.mjs [port]

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync, createReadStream } from 'node:fs';
import { createServer } from 'node:https';
import { networkInterfaces } from 'node:os';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { generate } from 'selfsigned';

const ROOT = resolve('dist');
const CERT_DIR = resolve('.cert');
const PORT = Number(process.argv[2]) || 8443;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.task': 'application/octet-stream',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
};

function lanAddresses() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((a) => a && a.family === 'IPv4' && !a.internal && !a.address.startsWith('169.254.'))
    .map((a) => a.address);
}

async function certificate(ips) {
  const keyFile = join(CERT_DIR, 'key.pem');
  const certFile = join(CERT_DIR, 'cert.pem');
  const ipsFile = join(CERT_DIR, 'ips.txt');
  const wanted = ips.join(',');
  if (existsSync(keyFile) && existsSync(certFile) && existsSync(ipsFile) && readFileSync(ipsFile, 'utf8') === wanted) {
    return { key: readFileSync(keyFile), cert: readFileSync(certFile) };
  }
  // New certificate whenever the PC's network address changes.
  const pems = await generate([{ name: 'commonName', value: 'FormAI local' }], {
    keySize: 2048,
    algorithm: 'sha256',
    extensions: [
      { name: 'basicConstraints', cA: false },
      { name: 'keyUsage', digitalSignature: true, keyEncipherment: true },
      { name: 'extKeyUsage', serverAuth: true },
      {
        name: 'subjectAltName',
        altNames: [{ type: 2, value: 'localhost' }, { type: 7, ip: '127.0.0.1' }, ...ips.map((ip) => ({ type: 7, ip }))],
      },
    ],
  });
  mkdirSync(CERT_DIR, { recursive: true });
  writeFileSync(keyFile, pems.private);
  writeFileSync(certFile, pems.cert);
  writeFileSync(ipsFile, wanted);
  return { key: pems.private, cert: pems.cert };
}

function fileFor(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^([/\\])+/, '');
  const full = join(ROOT, clean);
  if (full !== ROOT && !full.startsWith(ROOT + sep)) return null;
  if (existsSync(full) && statSync(full).isFile()) return full;
  if (existsSync(`${full}.html`)) return `${full}.html`;
  // Single-page app: unknown routes load the app shell.
  return join(ROOT, 'index.html');
}

if (!existsSync(join(ROOT, 'index.html'))) {
  console.error('No web build found. Run: npx expo export --platform web');
  process.exit(1);
}

const ips = lanAddresses();
const server = createServer(await certificate(ips), (req, res) => {
  const file = fileFor(req.url ?? '/');
  if (!file) {
    res.writeHead(403).end();
    return;
  }
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': file.endsWith('index.html') ? 'no-cache' : 'public, max-age=3600',
  });
  createReadStream(file).pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\nFormAI is running on your Wi-Fi. Open this on your phone (same Wi-Fi):\n');
  for (const ip of ips) console.log(`  https://${ip}:${PORT}`);
  console.log('\nThe certificate is self-signed, so the browser warns once:');
  console.log('  iPhone Safari: Show Details > visit this website > Visit Website');
  console.log('  Android Chrome: Advanced > Proceed\n');
});
