import { useQuery } from '@tanstack/react-query'

import { auditLogsApi } from '@/lib/api'

export interface AuditLogListParams {
  q?: string
  method?: string
  status_code?: number
  is_success?: boolean
  from_at?: string
  to_at?: string
  page: number
  size: number
}

export function useAuditLogsQuery(params: AuditLogListParams) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => auditLogsApi.list(params),
    refetchInterval: 15000,
  })
}
