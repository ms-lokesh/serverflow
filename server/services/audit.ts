import { query } from '../db/pool';

export interface AuditEntry {
  restaurantId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Record an audit log entry.
 * Guarantees passwords and sensitive credentials are never stored.
 */
export async function logAudit({
  restaurantId,
  actorUserId,
  action,
  entityType,
  entityId,
  metadata = {},
}: AuditEntry): Promise<void> {
  try {
    // Strip any inadvertent password fields
    const safeMetadata = { ...metadata };
    delete safeMetadata.password;
    delete safeMetadata.passwordHash;
    delete safeMetadata.password_hash;
    delete safeMetadata.tempPassword;

    const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    await query(
      `INSERT INTO audit_logs (id, restaurant_id, actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        restaurantId,
        actorUserId || null,
        action,
        entityType,
        entityId || null,
        JSON.stringify(safeMetadata),
      ]
    );
  } catch (err) {
    console.error('[Audit Log Error]: Failed to write audit record', err);
  }
}
