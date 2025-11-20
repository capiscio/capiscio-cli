import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ValidateCommand } from '../commands/validate';
import { BinaryManager } from '../utils/binary-manager';
import execa from 'execa';

// Mock dependencies
vi.mock('../utils/binary-manager');
vi.mock('execa');

describe('ValidateCommand Wrapper', () => {
  const mockBinaryPath = '/path/to/capiscio-core';
  const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup BinaryManager mock
    (BinaryManager.getInstance as any).mockReturnValue({
      getBinaryPath: vi.fn().mockResolvedValue(mockBinaryPath)
    });

    // Setup execa mock
    (execa as any).mockResolvedValue({ exitCode: 0 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should execute binary with basic arguments', async () => {
    await ValidateCommand.execute('agent.json', {});

    expect(BinaryManager.getInstance).toHaveBeenCalled();
    expect(execa).toHaveBeenCalledWith(
      mockBinaryPath,
      ['validate', 'agent.json'],
      expect.objectContaining({ stdio: 'inherit' })
    );
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should pass --strict flag', async () => {
    await ValidateCommand.execute('agent.json', { strict: true });

    expect(execa).toHaveBeenCalledWith(
      mockBinaryPath,
      ['validate', 'agent.json', '--strict'],
      expect.any(Object)
    );
  });

  it('should pass --progressive flag', async () => {
    await ValidateCommand.execute('agent.json', { progressive: true });

    expect(execa).toHaveBeenCalledWith(
      mockBinaryPath,
      ['validate', 'agent.json', '--progressive'],
      expect.any(Object)
    );
  });

  // it('should pass --conservative flag', async () => {
  //   await ValidateCommand.execute('agent.json', { conservative: true });

  //   expect(execa).toHaveBeenCalledWith(
  //     mockBinaryPath,
  //     ['validate', 'agent.json', '--conservative'],
  //     expect.any(Object)
  //   );
  // });

  it('should pass multiple flags', async () => {
    await ValidateCommand.execute('agent.json', { 
      strict: true, 
      json: true, 
      verbose: true 
    });

    expect(execa).toHaveBeenCalledWith(
      mockBinaryPath,
      expect.arrayContaining(['--strict', '--json', '--verbose']),
      expect.any(Object)
    );
  });

  it('should handle timeout option', async () => {
    await ValidateCommand.execute('agent.json', { timeout: '5000' });

    expect(execa).toHaveBeenCalledWith(
      mockBinaryPath,
      expect.arrayContaining(['--timeout', '5000ms']),
      expect.any(Object)
    );
  });

  it('should handle execution errors', async () => {
    const error = new Error('Execution failed');
    (execa as any).mockRejectedValue(error);

    await ValidateCommand.execute('agent.json', {});

    expect(mockConsoleError).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should propagate non-zero exit code', async () => {
    (execa as any).mockResolvedValue({ exitCode: 123 });

    await ValidateCommand.execute('agent.json', {});

    expect(mockExit).toHaveBeenCalledWith(123);
  });
});
