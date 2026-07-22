import { EventEmitter } from 'events';

class AuditLogEmitter extends EventEmitter {}

export const auditLogEmitter = new AuditLogEmitter();

// Bump maximum listener limits for concurrent super-admin connections
auditLogEmitter.setMaxListeners(50);
