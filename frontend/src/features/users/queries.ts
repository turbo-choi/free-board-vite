import { useMutation, useQuery } from '@tanstack/react-query'

import { usersApi } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import type { Role } from '@/types/domain'

export function useUsersQuery(params: { q?: string; page: number; size: number }) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.list(params),
  })
}

export function useUpdateUserRoleMutation() {
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: Role }) => usersApi.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUserActiveMutation() {
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => usersApi.updateActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useMyProfileQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['users', 'me', 'profile'],
    queryFn: usersApi.myProfile,
    enabled,
  })
}

export function useChangeMyPasswordMutation() {
  return useMutation({
    mutationFn: usersApi.changeMyPassword,
  })
}

export function useWithdrawMeMutation() {
  return useMutation({
    mutationFn: usersApi.withdrawMe,
  })
}
