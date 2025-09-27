#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building standalone binaries...');

// Ensure directories exist
const distDir = path.join(__dirname, '..', 'dist');
const binariesDir = path.join(distDir, 'binaries');

if (!fs.existsSync(binariesDir)) {
  fs.mkdirSync(binariesDir, { recursive: true });
}

// Step 1: Bundle with esbuild (inline all dependencies)
console.log('📦 Bundling with esbuild...');
try {
  execSync('npx esbuild src/cli.ts --bundle --platform=node --target=node18 --outfile=dist/cli-bundled.js --banner:js="#!/usr/bin/env node"', {
    stdio: 'inherit'
  });
  console.log('✅ Bundling complete');
} catch (error) {
  console.error('❌ Bundling failed:', error.message);
  process.exit(1);
}

// Step 2: Create binaries with pkg for multiple platforms
const platforms = [
  { target: 'node18-linux-x64', name: 'capiscio-linux-x64' },
  { target: 'node18-macos-x64', name: 'capiscio-darwin-x64' },
  { target: 'node18-win-x64', name: 'capiscio-win-x64.exe' }
];

console.log('🏗️  Creating platform binaries...');
for (const platform of platforms) {
  console.log(`   Building ${platform.name}...`);
  try {
    execSync(`npx pkg dist/cli-bundled.js --targets ${platform.target} --output dist/binaries/${platform.name}`, {
      stdio: 'inherit'
    });
    
    // Check if file was created and get its size
    const binaryPath = path.join(binariesDir, platform.name);
    if (fs.existsSync(binaryPath)) {
      const stats = fs.statSync(binaryPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(1);
      console.log(`   ✅ ${platform.name} created (${sizeInMB} MB)`);
    } else {
      console.log(`   ❌ ${platform.name} was not created`);
    }
  } catch (error) {
    console.error(`   ❌ Failed to create ${platform.name}:`, error.message);
  }
}

console.log('🎉 Binary build complete!');

// Step 3: Test the current platform binary
console.log('🧪 Testing local binary...');
try {
  const isWindows = process.platform === 'win32';
  const testBinary = isWindows ? 'capiscio-win-x64.exe' : 
                    process.platform === 'darwin' ? 'capiscio-darwin-x64' : 'capiscio-linux-x64';
  
  const testPath = path.join(binariesDir, testBinary);
  if (fs.existsSync(testPath)) {
    const testCmd = isWindows ? `"${testPath}"` : testPath;
    const result = execSync(`${testCmd} --version`, { encoding: 'utf8' });
    console.log(`✅ Local binary test passed: v${result.trim()}`);
  } else {
    console.log(`⚠️  Binary for current platform (${process.platform}) not found`);
  }
} catch (error) {
  console.error('❌ Binary test failed:', error.message);
}