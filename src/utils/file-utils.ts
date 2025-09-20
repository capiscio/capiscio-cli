import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
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
    const url = new URL(input);
    // Only consider http and https protocols as valid URLs
    return url.protocol === 'http:' || url.protocol === 'https:';
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

  // Check if input is a URL (starts with http/https or is a valid URL)
  if (isUrl(input)) {
    return { type: 'url', value: input };
  }

  // Check if input is an existing file
  if (existsSync(input)) {
    return { type: 'file', value: input };
  }

  // If it looks like a domain (has dots but no slashes/backslashes and no file extension-like ending)
  if (input.includes('.') && !input.includes('/') && !input.includes('\\') && 
      !input.endsWith('.json') && !input.endsWith('.js') && !input.endsWith('.txt') &&
      !input.includes(' ')) {
    return { type: 'url', value: `https://${input}` };
  }

  // Otherwise, it's a missing file
  throw new Error(`File not found: ${input}`);
}