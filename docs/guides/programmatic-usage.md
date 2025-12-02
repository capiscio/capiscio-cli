---
title: Programmatic Usage
description: How to use the capiscio CLI programmatically in Node.js applications.
---

# Programmatic Usage

For Node.js applications that need validation results, spawn the CLI with `--json` output.

---

## Basic Example

```typescript
import { spawnSync } from 'child_process';

interface ValidationResult {
  success: boolean;
  score: number;
  errors: Array<{ code: string; message: string }>;
  warnings: Array<{ code: string; message: string }>;
}

function validate(path: string): ValidationResult {
  const result = spawnSync('npx', ['capiscio', 'validate', path, '--json'], {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // CLI may exit with code 1 on validation failure but still outputs valid JSON
  const output = result.stdout || '';
  if (!output) {
    throw new Error(`Validation failed: ${result.stderr}`);
  }
  return JSON.parse(output);
}

// Usage
const result = validate('./agent-card.json');
console.log(`Valid: ${result.success}, Score: ${result.score}`);
```

---

## Async Version

```typescript
import { spawn } from 'child_process';

function validateAsync(path: string): Promise<ValidationResult> {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['capiscio', 'validate', path, '--json']);
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });
    
    child.on('close', (code) => {
      // CLI may exit with code 1 on validation failure but still outputs valid JSON
      if (stdout) {
        resolve(JSON.parse(stdout));
      } else {
        reject(new Error(stderr || 'Validation failed'));
      }
    });
  });
}
```

---

## Batch Validation

```typescript
import { glob } from 'glob';

async function validateAll(pattern: string) {
  const files = await glob(pattern);
  
  const results = await Promise.all(
    files.map(async file => ({
      file,
      result: await validateAsync(file)
    }))
  );
  
  const passed = results.filter(r => r.result.success);
  const failed = results.filter(r => !r.result.success);
  
  console.log(`✅ Passed: ${passed.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  return results;
}

// Usage
await validateAll('./agents/**/*.json');
```

---

## Express Middleware

```typescript
import express from 'express';
import { spawnSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { randomUUID } from 'crypto';

const app = express();
app.use(express.json());

app.post('/api/validate', (req, res) => {
  // Write to temp file
  const tempFile = `/tmp/agent-${randomUUID()}.json`;
  writeFileSync(tempFile, JSON.stringify(req.body));
  
  try {
    const result = spawnSync('npx', ['capiscio', 'validate', tempFile, '--json'], {
      encoding: 'utf8'
    });
    
    const output = result.stdout || '';
    if (output) {
      res.json(JSON.parse(output));
    } else {
      res.status(500).json({ error: result.stderr || 'Validation failed' });
    }
  } finally {
    unlinkSync(tempFile);
  }
});
```

---

## Why Not a Native API?

The `capiscio` npm package is a **distribution wrapper** for the Go-based validation engine. This approach:

- ✅ Ensures consistent validation across all platforms
- ✅ Leverages the high-performance Go implementation
- ✅ Keeps the npm package lightweight
- ✅ Single source of truth for validation logic

For native TypeScript integration, the spawning patterns shown above provide full access to all CLI features with proper error handling.
