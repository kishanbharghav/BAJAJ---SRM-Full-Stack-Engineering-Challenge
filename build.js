const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Building frontend...');
execSync('npm run build', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });

const publicDir = path.join(__dirname, 'public');
const distDir = path.join(__dirname, 'frontend', 'dist');

if (fs.existsSync(publicDir)) {
  fs.rmSync(publicDir, { recursive: true, force: true });
}

console.log('Copying frontend build to public directory...');
fs.cpSync(distDir, publicDir, { recursive: true });

console.log('Build complete!');
