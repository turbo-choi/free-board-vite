import { useMutation, useQuery } from '@tanstack/react-query'

import { menuCategoriesApi, menusApi } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'

export function useMenusQuery() {
  return useQuery({ queryKey: ['menus'], queryFn: menusApi.list })
}

export function useNavigationMenusQuery() {
  return useQuery({ queryKey: ['menus', 'navigation'], queryFn: menusApi.navigation })
}

export function useCreateMenuMutation() {
  return useMutation({
    mutationFn: menusApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
      queryClient.invalidateQueries({ queryKey: ['menus', 'navigation'] })
    },
  })
}

export function useUpdateMenuMutation() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof menusApi.update>[1] }) =>
      menusApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
      queryClient.invalidateQueries({ queryKey: ['menus', 'navigation'] })
    },
  })
}

export function useDeleteMenuMutation() {
  return useMutation({
    mutationFn: menusApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
      queryClient.invalidateQueries({ queryKey: ['menus', 'navigation'] })
    },
  })
}

export function useReorderMenusMutation() {
  return useMutation({
    mutationFn: menusApi.reorder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
      queryClient.invalidateQueries({ queryKey: ['menus', 'navigation'] })
    },
  })
}

export function useMenuCategoriesQuery() {
  return useQuery({ queryKey: ['menu-categories'], queryFn: menuCategoriesApi.list })
}

export function useCreateMenuCategoryMutation() {
  return useMutation({
    mutationFn: menuCategoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] })
      queryClient.invalidateQueries({ queryKey: ['menus'] })
      queryClient.invalidateQueries({ queryKey: ['menus', 'navigation'] })
    },
  })
}

export function useDeleteMenuCategoryMutation() {
  return useMutation({
    mutationFn: menuCategoriesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] })
      queryClient.invalidateQueries({ queryKey: ['menus'] })
      queryClient.invalidateQueries({ queryKey: ['menus', 'navigation'] })
    },
  })
}

export function useReorderMenuCategoriesMutation() {
  return useMutation({
    mutationFn: menuCategoriesApi.reorder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] })
      queryClient.invalidateQueries({ queryKey: ['menus', 'navigation'] })
    },
  })
}
