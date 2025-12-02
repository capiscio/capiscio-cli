---
title: Programmatic Usage
description: How to use the capiscio CLI programmatically in Node.js applications.
---

# Programmatic Usage

For Node.js applications that need validation results, spawn the CLI with `--json` output.

---

## Basic Example

```typescript
import { execSync } from 'child_process';

interface ValidationResult {
  success: boolean;
  score: number;
  errors: Array<{ code: string; message: string }>;
  warnings: Array<{ code: string; message: string }>;
}

function validate(path: string): ValidationResult {
  try {
    const output = execSync(`npx capiscio validate "${path}" --json`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return JSON.parse(output);
  } catch (error: any) {
    // CLI exits with code 1 on validation failure, but still outputs JSON
    if (error.stdout) {
      return JSON.parse(error.stdout);
    }
    throw error;
  }
}

// Usage
const result = validate('./agent-card.json');
console.log(`Valid: ${result.success}, Score: ${result.score}`);
```

---

## Async Version

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function validateAsync(path: string): Promise<ValidationResult> {
  try {
    const { stdout } = await execAsync(`npx capiscio validate "${path}" --json`);
    return JSON.parse(stdout);
  } catch (error: any) {
    if (error.stdout) {
      return JSON.parse(error.stdout);
    }
    throw error;
  }
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
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { randomUUID } from 'crypto';

const app = express();
app.use(express.json());

app.post('/api/validate', (req, res) => {
  // Write to temp file
  const tempFile = `/tmp/agent-${randomUUID()}.json`;
  writeFileSync(tempFile, JSON.stringify(req.body));
  
  try {
    const output = execSync(`npx capiscio validate "${tempFile}" --json`, {
      encoding: 'utf8'
    });
    res.json(JSON.parse(output));
  } catch (error: any) {
    if (error.stdout) {
      res.json(JSON.parse(error.stdout));
    } else {
      res.status(500).json({ error: 'Validation failed' });
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

For deep TypeScript integration, consider using the [capiscio-sdk-python](../../reference/sdk-python/index.md) pattern with your own HTTP middleware.
