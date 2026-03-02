import { useMutation, useQuery } from '@tanstack/react-query'

import { authApi } from '@/lib/api'

export function useMeQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled,
  })
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: authApi.login,
  })
}
