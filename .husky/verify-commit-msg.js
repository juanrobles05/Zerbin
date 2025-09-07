#!/usr/bin/env node

const fs = require('fs');

const msgPath = process.argv[2];

if (!msgPath || !fs.existsSync(msgPath)) {
  console.error('❌ No se encontró el mensaje del commit.');
  process.exit(1);
}

const fullMsg = fs.readFileSync(msgPath, 'utf-8').trim();
const firstLine = fullMsg.split('\n')[0]; // 💡 Solo la primera línea

// 👉 Nueva regla: permitir merges
if (firstLine.startsWith('Merge')) {
  process.exit(0); // ✅ Merge permitido, salimos sin error
}

const commitRE = /^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|revert)(\([^\)]+\))?: .+$/;

if (!commitRE.test(firstLine)) {
  console.error(`❌ Tu mensaje de commit no sigue el formato convencional.`);
  console.info(`💡 Usa: npm run commit o npx cz`);
  console.info(`📄 Primera línea: "${firstLine}"`);
  process.exit(1);
}
