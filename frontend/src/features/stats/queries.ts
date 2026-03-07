import { useQuery } from '@tanstack/react-query'

import { statsApi } from '@/lib/api'

interface StatsMonitoringParams {
  days?: number
  month?: string
}

export function useDashboardStatsQuery() {
  return useQuery({
    queryKey: ['stats', 'dashboard'],
    queryFn: statsApi.dashboard,
  })
}

export function useStatsMonitoringQuery(params: StatsMonitoringParams) {
  return useQuery({
    queryKey: ['stats', 'monitoring', params],
    queryFn: () => statsApi.monitoring(params),
  })
}
