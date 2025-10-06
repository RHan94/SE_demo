const fs = require('node:fs');
const path = require('node:path');

const sourceDir = path.join(__dirname, '..', 'static');
const targetDir = path.join(__dirname, '..', 'dist', 'renderer');

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyFolderContents(src, dest) {
  ensureDirectory(dest);

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyFolderContents(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (!fs.existsSync(sourceDir)) {
  console.warn(`Static directory not found at ${sourceDir}. Skipping copy step.`);
  process.exit(0);
}

copyFolderContents(sourceDir, targetDir);
console.log(`Copied static assets from ${sourceDir} to ${targetDir}.`);
