const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      // Skip node_modules, .next, .git
      if (f !== 'node_modules' && f !== '.next' && f !== '.git') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

const targetDirs = ['app', 'components'];
let modifiedCount = 0;

targetDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) return;

  walkDir(dirPath, (filePath) => {
    const ext = path.extname(filePath);
    if (ext !== '.ts' && ext !== '.tsx') return;

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // 1. Replace http://localhost:3000 references with template literal using API_URL
    // Case 1: Double quotes "http://localhost:3000..."
    content = content.replace(/"http:\/\/localhost:3000([^"]*)"/g, '`${API_URL}$1`');
    // Case 2: Single quotes 'http://localhost:3000...'
    content = content.replace(/'http:\/\/localhost:3000([^']*)'/g, '`${API_URL}$1`');
    // Case 3: Backticks `http://localhost:3000...`
    content = content.replace(/`http:\/\/localhost:3000([^`]*)`/g, '`${API_URL}$1`');

    // 2. Add API_URL import if needed and missing
    if (content.includes('API_URL') && !content.includes('@/config/api')) {
      const importStr = 'import { API_URL } from "@/config/api";\n';
      
      if (content.startsWith('"use client";') || content.startsWith("'use client';")) {
        content = content.replace(/^(["']use client["'];?[\r\n]+)/, `$1${importStr}`);
      } else {
        content = importStr + content;
      }
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Refactored API URL in: ${path.relative(__dirname, filePath)}`);
      modifiedCount++;
    }
  });
});

console.log(`Finished! Refactored ${modifiedCount} files.`);
