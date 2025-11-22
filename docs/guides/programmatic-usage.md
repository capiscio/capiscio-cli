# Programmatic Usage

You can also use the CapiscIO wrapper programmatically in your Node.js scripts.

## Installation

```bash
npm install capiscio
```

## Example

```typescript
import { ValidateCommand } from 'capiscio';

// Execute validation programmatically
// Note: This currently spawns the binary and inherits stdio
await ValidateCommand.execute('./agent-card.json', {
  json: true,
  strict: true
});
```

> **Note**: The programmatic API is currently minimal and primarily designed for CLI usage. For deeper integration, consider using the `capiscio-core` binary directly via `child_process`.
