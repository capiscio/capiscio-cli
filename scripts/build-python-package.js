#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🐍 Building Python package with binaries...');

const rootDir = path.join(__dirname, '..');
const pythonDir = path.join(rootDir, 'python-package');
const binariesDir = path.join(rootDir, 'dist', 'binaries');
const pythonBinariesDir = path.join(pythonDir, 'capiscio', 'binaries');

// Step 1: Build the Node.js binaries first
console.log('🔨 Building Node.js binaries...');
try {
  execSync('npm run build:binaries', { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Node.js binaries built successfully');
} catch (error) {
  console.error('❌ Failed to build Node.js binaries:', error.message);
  process.exit(1);
}

// Step 2: Copy binaries to Python package
console.log('📋 Copying binaries to Python package...');

// Ensure Python binaries directory exists
if (!fs.existsSync(pythonBinariesDir)) {
  fs.mkdirSync(pythonBinariesDir, { recursive: true });
}

// Clear existing binaries
const existingFiles = fs.readdirSync(pythonBinariesDir);
for (const file of existingFiles) {
  fs.unlinkSync(path.join(pythonBinariesDir, file));
  console.log(`   🗑️  Removed old binary: ${file}`);
}

// Copy new binaries
const binaryFiles = fs.readdirSync(binariesDir);
for (const file of binaryFiles) {
  const srcPath = path.join(binariesDir, file);
  const destPath = path.join(pythonBinariesDir, file);
  
  fs.copyFileSync(srcPath, destPath);
  
  const stats = fs.statSync(destPath);
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(1);
  console.log(`   ✅ Copied ${file} (${sizeInMB} MB)`);
}

// Step 3: Update version in Python files
console.log('📝 Updating version information...');

// Read version from package.json
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Update pyproject.toml
const pyprojectPath = path.join(pythonDir, 'pyproject.toml');
let pyproject = fs.readFileSync(pyprojectPath, 'utf8');
pyproject = pyproject.replace(/version = "[^"]*"/, `version = "${version}"`);
fs.writeFileSync(pyprojectPath, pyproject);
console.log(`   ✅ Updated pyproject.toml to version ${version}`);

// Update __init__.py
const initPath = path.join(pythonDir, 'capiscio', '__init__.py');
let initContent = fs.readFileSync(initPath, 'utf8');
initContent = initContent.replace(/__version__ = "[^"]*"/, `__version__ = "${version}"`);
fs.writeFileSync(initPath, initContent);
console.log(`   ✅ Updated __init__.py to version ${version}`);

// Step 4: Build Python package
console.log('📦 Building Python package...');
try {
  // Clean previous build
  const buildDirs = ['build', 'dist', '*.egg-info'];
  for (const dir of buildDirs) {
    const fullPath = path.join(pythonDir, dir);
    if (fs.existsSync(fullPath)) {
      execSync(`rm -rf "${fullPath}"`, { cwd: pythonDir });
    }
  }
  
  // Build the package
  execSync('python -m build', { cwd: pythonDir, stdio: 'inherit' });
  console.log('✅ Python package built successfully');
  
  // List the built files
  const distFiles = fs.readdirSync(path.join(pythonDir, 'dist'));
  console.log('📄 Built files:');
  for (const file of distFiles) {
    const filePath = path.join(pythonDir, 'dist', file);
    const stats = fs.statSync(filePath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(1);
    console.log(`   ${file} (${sizeInMB} MB)`);
  }
  
} catch (error) {
  console.error('❌ Python package build failed:', error.message);
  console.log('\n💡 Make sure you have the required Python build tools installed:');
  console.log('   pip install build twine');
  process.exit(1);
}

console.log('🎉 Python package build complete!');
console.log('\n📋 Next steps:');
console.log('1. Test the package locally:');
console.log(`   cd ${pythonDir}`);
console.log('   pip install dist/*.whl');
console.log('   capiscio --version');
console.log('');
console.log('2. Upload to PyPI (when ready):');
console.log('   python -m twine upload dist/*');