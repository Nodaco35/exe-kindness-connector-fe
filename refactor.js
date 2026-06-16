const fs = require('fs');
const path = require('path');

const files = [
  'app/admin/page.tsx',
  'app/books/[id]/page.tsx',
  'app/chat/page.tsx',
  'app/forgot-password/page.tsx',
  'app/login/page.tsx',
  'app/page.tsx',
  'app/post/page.tsx',
  'app/profile/page.tsx',
  'app/register/page.tsx',
  'app/requests/page.tsx',
  'app/rewards/page.tsx',
  'components/AuthGate.tsx',
  'components/Header.tsx',
  'components/RatingModal.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add import if missing
  if (content.includes('API_URL') && !content.includes('@/config/api')) {
    const importStr = 'import { API_URL } from "@/config/api";\n';
    
    if (content.startsWith('"use client";') || content.startsWith("'use client';")) {
      content = content.replace(/^(["']use client["'];?[\r\n]+)/, `$1${importStr}`);
    } else {
      content = importStr + content;
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Added import to:", file);
  }
});
console.log("Done");
