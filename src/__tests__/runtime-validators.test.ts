import { describe, it, expect } from 'vitest';
import {
  validateTask,
  validateStatusUpdate,
  validateArtifactUpdate,
  validateMessage,
  validateRuntimeMessage,
  type RuntimeValidationResult
} from '../validator/runtime-validators';

describe('Runtime Message Validators', () => {
  describe('validateTask', () => {
    it('should validate a valid Task message', () => {
      const validTask = {
        id: 'task-123',
        status: {
          state: 'working'
        }
      };

      const result = validateTask(validTask);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when id is missing', () => {
      const invalidTask = {
        status: {
          state: 'working'
        }
      };

      const result = validateTask(invalidTask);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('TASK_MISSING_ID');
      expect(result.errors[0]?.field).toBe('id');
    });

    it('should fail when id is not a string', () => {
      const invalidTask = {
        id: 123,
        status: {
          state: 'working'
        }
      };

      const result = validateTask(invalidTask);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'TASK_MISSING_ID')).toBe(true);
    });

    it('should fail when status is missing', () => {
      const invalidTask = {
        id: 'task-123'
      };

      const result = validateTask(invalidTask);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'TASK_MISSING_STATUS')).toBe(true);
    });

    it('should fail when status.state is missing', () => {
      const invalidTask = {
        id: 'task-123',
        status: {}
      };

      const result = validateTask(invalidTask);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'TASK_MISSING_STATUS_STATE')).toBe(true);
      expect(result.errors[0]?.field).toBe('status.state');
    });

    it('should fail when status.state is not a string', () => {
      const invalidTask = {
        id: 'task-123',
        status: {
          state: 123
        }
      };

      const result = validateTask(invalidTask);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'TASK_MISSING_STATUS_STATE')).toBe(true);
    });

    it('should fail with multiple errors when multiple fields are missing', () => {
      const invalidTask = {};

      const result = validateTask(invalidTask);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors.some(e => e.code === 'TASK_MISSING_ID')).toBe(true);
      expect(result.errors.some(e => e.code === 'TASK_MISSING_STATUS')).toBe(true);
    });
  });

  describe('validateStatusUpdate', () => {
    it('should validate a valid StatusUpdate message', () => {
      const validStatusUpdate = {
        status: {
          state: 'completed'
        }
      };

      const result = validateStatusUpdate(validStatusUpdate);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when status is missing', () => {
      const invalidStatusUpdate = {};

      const result = validateStatusUpdate(invalidStatusUpdate);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('STATUS_UPDATE_MISSING_STATUS');
      expect(result.errors[0]?.field).toBe('status');
    });

    it('should fail when status.state is missing', () => {
      const invalidStatusUpdate = {
        status: {}
      };

      const result = validateStatusUpdate(invalidStatusUpdate);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('STATUS_UPDATE_MISSING_STATE');
      expect(result.errors[0]?.field).toBe('status.state');
    });

    it('should fail when status is not an object', () => {
      const invalidStatusUpdate = {
        status: 'completed'
      };

      const result = validateStatusUpdate(invalidStatusUpdate);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'STATUS_UPDATE_MISSING_STATUS')).toBe(true);
    });

    it('should fail when status.state is not a string', () => {
      const invalidStatusUpdate = {
        status: {
          state: true
        }
      };

      const result = validateStatusUpdate(invalidStatusUpdate);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'STATUS_UPDATE_MISSING_STATE')).toBe(true);
    });
  });

  describe('validateArtifactUpdate', () => {
    it('should validate a valid ArtifactUpdate message', () => {
      const validArtifactUpdate = {
        artifact: {
          parts: [
            { type: 'text', content: 'Hello' }
          ]
        }
      };

      const result = validateArtifactUpdate(validArtifactUpdate);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when artifact is missing', () => {
      const invalidArtifactUpdate = {};

      const result = validateArtifactUpdate(invalidArtifactUpdate);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('ARTIFACT_UPDATE_MISSING_ARTIFACT');
      expect(result.errors[0]?.field).toBe('artifact');
    });

    it('should fail when artifact.parts is missing', () => {
      const invalidArtifactUpdate = {
        artifact: {}
      };

      const result = validateArtifactUpdate(invalidArtifactUpdate);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('ARTIFACT_MISSING_PARTS_ARRAY');
      expect(result.errors[0]?.field).toBe('artifact.parts');
    });

    it('should fail when artifact.parts is not an array', () => {
      const invalidArtifactUpdate = {
        artifact: {
          parts: 'not-an-array'
        }
      };

      const result = validateArtifactUpdate(invalidArtifactUpdate);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'ARTIFACT_MISSING_PARTS_ARRAY')).toBe(true);
    });

    it('should fail when artifact.parts is an empty array', () => {
      const invalidArtifactUpdate = {
        artifact: {
          parts: []
        }
      };

      const result = validateArtifactUpdate(invalidArtifactUpdate);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('ARTIFACT_EMPTY_PARTS');
      expect(result.errors[0]?.field).toBe('artifact.parts');
    });

    it('should validate artifact with multiple parts', () => {
      const validArtifactUpdate = {
        artifact: {
          parts: [
            { type: 'text', content: 'Part 1' },
            { type: 'text', content: 'Part 2' }
          ]
        }
      };

      const result = validateArtifactUpdate(validArtifactUpdate);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateMessage', () => {
    it('should validate a valid Message', () => {
      const validMessage = {
        role: 'agent',
        parts: [
          { type: 'text', content: 'Hello' }
        ]
      };

      const result = validateMessage(validMessage);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when parts is missing', () => {
      const invalidMessage = {
        role: 'agent'
      };

      const result = validateMessage(invalidMessage);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MESSAGE_MISSING_PARTS_ARRAY')).toBe(true);
    });

    it('should fail when parts is not an array', () => {
      const invalidMessage = {
        role: 'agent',
        parts: 'not-an-array'
      };

      const result = validateMessage(invalidMessage);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MESSAGE_MISSING_PARTS_ARRAY')).toBe(true);
    });

    it('should fail when parts is an empty array', () => {
      const invalidMessage = {
        role: 'agent',
        parts: []
      };

      const result = validateMessage(invalidMessage);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MESSAGE_EMPTY_PARTS')).toBe(true);
      expect(result.errors[0]?.field).toBe('parts');
    });

    it('should fail when role is missing', () => {
      const invalidMessage = {
        parts: [
          { type: 'text', content: 'Hello' }
        ]
      };

      const result = validateMessage(invalidMessage);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MESSAGE_MISSING_ROLE')).toBe(true);
    });

    it('should fail when role is not "agent"', () => {
      const invalidMessage = {
        role: 'user',
        parts: [
          { type: 'text', content: 'Hello' }
        ]
      };

      const result = validateMessage(invalidMessage);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MESSAGE_INVALID_ROLE')).toBe(true);
      expect(result.errors[0]?.field).toBe('role');
    });

    it('should fail with multiple errors when multiple fields are invalid', () => {
      const invalidMessage = {
        role: 'user',
        parts: []
      };

      const result = validateMessage(invalidMessage);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors.some(e => e.code === 'MESSAGE_EMPTY_PARTS')).toBe(true);
      expect(result.errors.some(e => e.code === 'MESSAGE_INVALID_ROLE')).toBe(true);
    });

    it('should validate message with multiple parts', () => {
      const validMessage = {
        role: 'agent',
        parts: [
          { type: 'text', content: 'Part 1' },
          { type: 'text', content: 'Part 2' }
        ]
      };

      const result = validateMessage(validMessage);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateRuntimeMessage', () => {
    it('should validate a Task message by kind', () => {
      const message = {
        kind: 'task',
        id: 'task-123',
        status: {
          state: 'working'
        }
      };

      const result = validateRuntimeMessage(message);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a StatusUpdate message by kind', () => {
      const message = {
        kind: 'status-update',
        status: {
          state: 'completed'
        }
      };

      const result = validateRuntimeMessage(message);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate an ArtifactUpdate message by kind', () => {
      const message = {
        kind: 'artifact-update',
        artifact: {
          parts: [{ type: 'text', content: 'Result' }]
        }
      };

      const result = validateRuntimeMessage(message);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a Message by kind', () => {
      const message = {
        kind: 'message',
        role: 'agent',
        parts: [{ type: 'text', content: 'Hello' }]
      };

      const result = validateRuntimeMessage(message);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when kind is missing', () => {
      const message = {
        role: 'agent',
        parts: [{ type: 'text', content: 'Hello' }]
      };

      const result = validateRuntimeMessage(message);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('MESSAGE_MISSING_KIND');
      expect(result.errors[0]?.field).toBe('kind');
    });

    it('should fail for unknown message kind', () => {
      const message = {
        kind: 'unknown-kind',
        data: {}
      };

      const result = validateRuntimeMessage(message);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('MESSAGE_UNKNOWN_KIND');
      expect(result.errors[0]?.message).toContain('unknown-kind');
    });

    it('should handle case-insensitive kind matching', () => {
      const message = {
        kind: 'TASK',
        id: 'task-123',
        status: {
          state: 'working'
        }
      };

      const result = validateRuntimeMessage(message);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should propagate validation errors from specific validators', () => {
      const message = {
        kind: 'task',
        id: 'task-123'
        // missing status
      };

      const result = validateRuntimeMessage(message);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'TASK_MISSING_STATUS')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null input gracefully', () => {
      const result = validateRuntimeMessage(null);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle undefined input gracefully', () => {
      const result = validateRuntimeMessage(undefined);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty object', () => {
      const result = validateRuntimeMessage({});

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MESSAGE_MISSING_KIND')).toBe(true);
    });

    it('should handle kind as non-string', () => {
      const message = {
        kind: 123,
        data: {}
      };

      const result = validateRuntimeMessage(message);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MESSAGE_MISSING_KIND')).toBe(true);
    });

    it('should validate all error fields have required properties', () => {
      const invalidMessage = {
        kind: 'task'
      };

      const result = validateRuntimeMessage(invalidMessage);

      result.errors.forEach(error => {
        expect(error).toHaveProperty('code');
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('severity');
        expect(error.severity).toBe('error');
        expect(typeof error.code).toBe('string');
        expect(typeof error.message).toBe('string');
      });
    });
  });
});
