import { useMutation, useQuery } from '@tanstack/react-query'

import { commentsApi } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'

export function useCommentsQuery(postId: number) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => commentsApi.list(postId),
    enabled: postId > 0,
  })
}

export function useCreateCommentMutation(postId: number) {
  return useMutation({
    mutationFn: (payload: { content: string }) => commentsApi.create(postId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useUpdateCommentMutation(postId: number) {
  return useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => commentsApi.update(id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    },
  })
}

export function useDeleteCommentMutation(postId: number) {
  return useMutation({
    mutationFn: commentsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}
