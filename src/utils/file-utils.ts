import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { AgentCard } from '../types';

/**
 * Auto-detect agent card files in common locations
 */
export async function detectAgentCard(): Promise<string | null> {
  const candidates = [
    './agent-card.json',
    './.well-known/agent-card.json', 
    './src/agent-card.json',
    './public/.well-known/agent-card.json',
    './dist/.well-known/agent-card.json',
    // Legacy support
    './agent.json',
    './.well-known/agent.json'
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Read and parse an agent card from a file
 */
export async function readAgentCard(filePath: string): Promise<AgentCard> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Agent card file does not contain a valid JSON object');
    }

    return parsed as AgentCard;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in agent card file: ${error.message}`);
    }
    throw new Error(`Failed to read agent card: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a string is a URL
 */
export function isUrl(input: string): boolean {
  try {
    new URL(input);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve input to either a file path or URL
 */
export async function resolveInput(input: string | undefined): Promise<{ type: 'file' | 'url'; value: string } | null> {
  // If no input provided, try to auto-detect
  if (!input) {
    const detected = await detectAgentCard();
    if (detected) {
      return { type: 'file', value: detected };
    }
    return null;
  }

  // Check if input is a URL
  if (isUrl(input)) {
    return { type: 'url', value: input };
  }

  // Check if input is an existing file
  if (existsSync(input)) {
    return { type: 'file', value: input };
  }

  // If file doesn't exist, treat as URL (let HTTP client handle the error)
  if (input.includes('.') && !input.includes(' ')) {
    return { type: 'url', value: input.startsWith('http') ? input : `https://${input}` };
  }

  throw new Error(`Input "${input}" is neither a valid file path nor a URL`);
}