import { useMutation, useQuery } from '@tanstack/react-query'

import { boardsApi } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'

export function useBoardsQuery() {
  return useQuery({ queryKey: ['boards'], queryFn: boardsApi.list })
}

export function useCreateBoardMutation() {
  return useMutation({
    mutationFn: boardsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    },
  })
}

export function useUpdateBoardMutation() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof boardsApi.update>[1] }) =>
      boardsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    },
  })
}

export function useDeleteBoardMutation() {
  return useMutation({
    mutationFn: boardsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    },
  })
}
