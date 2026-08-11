import api from '@/lib/axios'

export interface AuditLogApi {
  id: string
  user: { id: string; name: string } | null
  action: string
  entityType: string
  entityId: string
  metadata: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: string
}

export const auditService = {
  findAll(limit?: number): Promise<AuditLogApi[]> {
    return api.get('/audit', { params: { limit } }).then(r => r.data.data)
  },
}
