/**
 * Runtime Message Validators for A2A Protocol
 * 
 * These validators check runtime messages exchanged between agents and clients
 * during protocol execution. Based on a2a-inspector's validation logic.
 * 
 * Validates message types:
 * - Task: Initial task assignment
 * - StatusUpdate: Task status changes
 * - ArtifactUpdate: Artifact/output updates
 * - Message: Agent messages/responses
 */

export interface RuntimeValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error';
}

export interface RuntimeValidationResult {
  valid: boolean;
  errors: RuntimeValidationError[];
}

/**
 * Validate a Task message
 * Required fields:
 * - id: Task identifier
 * - status.state: Current task state
 */
export function validateTask(data: any): RuntimeValidationResult {
  const errors: RuntimeValidationError[] = [];

  // Validate id field
  if (!data.id || typeof data.id !== 'string') {
    errors.push({
      code: 'TASK_MISSING_ID',
      message: "Task object missing required field: 'id'",
      field: 'id',
      severity: 'error'
    });
  }

  // Validate status.state field
  if (!data.status || typeof data.status !== 'object') {
    errors.push({
      code: 'TASK_MISSING_STATUS',
      message: "Task object missing required field: 'status'",
      field: 'status',
      severity: 'error'
    });
  } else if (!data.status.state || typeof data.status.state !== 'string') {
    errors.push({
      code: 'TASK_MISSING_STATUS_STATE',
      message: "Task object missing required field: 'status.state'",
      field: 'status.state',
      severity: 'error'
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate a StatusUpdate message
 * Required fields:
 * - status.state: Current status state
 */
export function validateStatusUpdate(data: any): RuntimeValidationResult {
  const errors: RuntimeValidationError[] = [];

  // Validate status.state field
  if (!data.status || typeof data.status !== 'object') {
    errors.push({
      code: 'STATUS_UPDATE_MISSING_STATUS',
      message: "StatusUpdate object missing required field: 'status'",
      field: 'status',
      severity: 'error'
    });
  } else if (!data.status.state || typeof data.status.state !== 'string') {
    errors.push({
      code: 'STATUS_UPDATE_MISSING_STATE',
      message: "StatusUpdate object missing required field: 'status.state'",
      field: 'status.state',
      severity: 'error'
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate an ArtifactUpdate message
 * Required fields:
 * - artifact: Artifact object
 * - artifact.parts: Non-empty array of artifact parts
 */
export function validateArtifactUpdate(data: any): RuntimeValidationResult {
  const errors: RuntimeValidationError[] = [];

  // Validate artifact field
  if (!data.artifact || typeof data.artifact !== 'object') {
    errors.push({
      code: 'ARTIFACT_UPDATE_MISSING_ARTIFACT',
      message: "ArtifactUpdate object missing required field: 'artifact'",
      field: 'artifact',
      severity: 'error'
    });
  } else {
    // Validate artifact.parts is a non-empty array
    if (!Array.isArray(data.artifact.parts)) {
      errors.push({
        code: 'ARTIFACT_MISSING_PARTS_ARRAY',
        message: "Artifact object must have a 'parts' array",
        field: 'artifact.parts',
        severity: 'error'
      });
    } else if (data.artifact.parts.length === 0) {
      errors.push({
        code: 'ARTIFACT_EMPTY_PARTS',
        message: "Artifact object must have a non-empty 'parts' array",
        field: 'artifact.parts',
        severity: 'error'
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate a Message
 * Required fields:
 * - parts: Non-empty array of message parts
 * - role: Must be 'agent' for agent messages
 */
export function validateMessage(data: any): RuntimeValidationResult {
  const errors: RuntimeValidationError[] = [];

  // Validate parts is a non-empty array
  if (!Array.isArray(data.parts)) {
    errors.push({
      code: 'MESSAGE_MISSING_PARTS_ARRAY',
      message: "Message object must have a 'parts' array",
      field: 'parts',
      severity: 'error'
    });
  } else if (data.parts.length === 0) {
    errors.push({
      code: 'MESSAGE_EMPTY_PARTS',
      message: "Message object must have a non-empty 'parts' array",
      field: 'parts',
      severity: 'error'
    });
  }

  // Validate role is 'agent'
  if (!data.role || typeof data.role !== 'string') {
    errors.push({
      code: 'MESSAGE_MISSING_ROLE',
      message: "Message object missing required field: 'role'",
      field: 'role',
      severity: 'error'
    });
  } else if (data.role !== 'agent') {
    errors.push({
      code: 'MESSAGE_INVALID_ROLE',
      message: "Message from agent must have 'role' set to 'agent'",
      field: 'role',
      severity: 'error'
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate a runtime message based on its kind
 * Dispatches to the appropriate validator based on message type
 */
export function validateRuntimeMessage(data: any): RuntimeValidationResult {
  // Handle null/undefined input
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: [{
        code: 'MESSAGE_INVALID_INPUT',
        message: 'Invalid message: expected an object',
        severity: 'error'
      }]
    };
  }

  // Check for required 'kind' field
  if (!data.kind || typeof data.kind !== 'string') {
    return {
      valid: false,
      errors: [{
        code: 'MESSAGE_MISSING_KIND',
        message: "Response from agent is missing required 'kind' field",
        field: 'kind',
        severity: 'error'
      }]
    };
  }

  // Dispatch to appropriate validator based on kind
  const kind = data.kind.toLowerCase();
  
  switch (kind) {
    case 'task':
      return validateTask(data);
    
    case 'status-update':
      return validateStatusUpdate(data);
    
    case 'artifact-update':
      return validateArtifactUpdate(data);
    
    case 'message':
      return validateMessage(data);
    
    default:
      return {
        valid: false,
        errors: [{
          code: 'MESSAGE_UNKNOWN_KIND',
          message: `Unknown message kind received: '${data.kind}'`,
          field: 'kind',
          severity: 'error'
        }]
      };
  }
}
