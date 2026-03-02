import { useQuery } from '@tanstack/react-query'

import { statsApi } from '@/lib/api'

interface StatsMonitoringParams {
  days?: number
  month?: string
}

export function useStatsMonitoringQuery(params: StatsMonitoringParams) {
  return useQuery({
    queryKey: ['stats', 'monitoring', params],
    queryFn: () => statsApi.monitoring(params),
  })
}
