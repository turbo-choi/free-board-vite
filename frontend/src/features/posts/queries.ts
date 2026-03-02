import { useMutation, useQuery } from '@tanstack/react-query'

import { postsApi, type PostListParams } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'

export function usePostsQuery(params: PostListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: () => postsApi.list(params),
    enabled: options?.enabled ?? true,
  })
}

export function usePostDetailQuery(postId: number) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => postsApi.detail(postId),
    enabled: Number.isFinite(postId) && postId > 0,
  })
}

export function useCreatePostMutation() {
  return useMutation({
    mutationFn: postsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useUpdatePostMutation() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof postsApi.update>[1] }) =>
      postsApi.update(id, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post', vars.id] })
    },
  })
}

export function useDeletePostMutation() {
  return useMutation({
    mutationFn: postsApi.remove,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.removeQueries({ queryKey: ['post', id] })
    },
  })
}
