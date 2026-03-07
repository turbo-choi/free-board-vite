import axios from 'axios'

import type { LoginResponse } from '@/types/api'
import type {
  AuditLogEntry,
  Attachment,
  Board,
  Comment,
  DashboardStats,
  Menu,
  MenuCategory,
  MyProfileResponse,
  NavigationMenuResponse,
  Paginated,
  PostDetail,
  PostListItem,
  Role,
  StatsMonitoring,
  User,
} from '@/types/domain'
import { getStoredToken } from '@/lib/auth'

let unauthorizedHandler: (() => void) | null = null

export const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && unauthorizedHandler) {
      unauthorizedHandler()
    }
    return Promise.reject(error)
  }
)

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler
}

export function toApiError(error: unknown) {
  if (axios.isAxiosError<{ message?: string; code?: string }>(error)) {
    return {
      message: error.response?.data?.message ?? error.message,
      code: error.response?.data?.code ?? 'REQUEST_FAILED',
    }
  }
  return { message: 'Unknown error', code: 'UNKNOWN' }
}

export interface PostListParams {
  boardSlug?: string
  q?: string
  sort?: 'latest' | 'view' | 'comment'
  page?: number
  size?: number
  from?: string
  to?: string
}

export const authApi = {
  async login(payload: { email: string; password: string }) {
    const { data } = await api.post<LoginResponse>('/auth/login', payload)
    return data
  },
  async signup(payload: { email: string; name: string; password: string }) {
    const { data } = await api.post<LoginResponse>('/auth/signup', payload)
    return data
  },
  async me() {
    const { data } = await api.get<User>('/auth/me')
    return data
  },
}

export const boardsApi = {
  async list() {
    const { data } = await api.get<{ items: Board[] }>('/boards')
    return data.items
  },
  async create(payload: {
    name: string
    slug: string
    description?: string
    settings_json: { allowAnonymous: boolean; allowAttachment: boolean; allowPin: boolean }
  }) {
    const { data } = await api.post<Board>('/boards', payload)
    return data
  },
  async update(
    id: number,
    payload: Partial<{
      name: string
      slug: string
      description: string | null
      settings_json: { allowAnonymous: boolean; allowAttachment: boolean; allowPin: boolean }
    }>
  ) {
    const { data } = await api.patch<Board>(`/boards/${id}`, payload)
    return data
  },
  async remove(id: number) {
    await api.delete(`/boards/${id}`)
  },
}

export const postsApi = {
  async list(params: PostListParams) {
    const { data } = await api.get<Paginated<PostListItem>>('/posts', { params })
    return data
  },
  async create(payload: { board_id: number; title: string; content: string; is_pinned: boolean }) {
    const { data } = await api.post<PostDetail>('/posts', payload)
    return data
  },
  async detail(id: number) {
    const { data } = await api.get<PostDetail>(`/posts/${id}`)
    return data
  },
  async update(
    id: number,
    payload: Partial<{ board_id: number; title: string; content: string; is_pinned: boolean }>
  ) {
    const { data } = await api.patch<PostDetail>(`/posts/${id}`, payload)
    return data
  },
  async remove(id: number) {
    await api.delete(`/posts/${id}`)
  },
}

export const commentsApi = {
  async list(postId: number) {
    const { data } = await api.get<{ items: Comment[] }>(`/posts/${postId}/comments`)
    return data.items
  },
  async create(postId: number, payload: { content: string }) {
    const { data } = await api.post<Comment>(`/posts/${postId}/comments`, payload)
    return data
  },
  async update(id: number, payload: { content: string }) {
    const { data } = await api.patch<Comment>(`/comments/${id}`, payload)
    return data
  },
  async remove(id: number) {
    await api.delete(`/comments/${id}`)
  },
}

export const attachmentsApi = {
  async upload(postId: number, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post<Attachment>(`/posts/${postId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
  async remove(id: number) {
    await api.delete(`/attachments/${id}`)
  },
  downloadUrl(id: number) {
    return `/api/attachments/${id}/download`
  },
}

export const menusApi = {
  async list() {
    const { data } = await api.get<{ items: Menu[] }>('/menus')
    return data.items
  },
  async navigation() {
    const { data } = await api.get<NavigationMenuResponse>('/menus/navigation')
    return data
  },
  async create(payload: {
    label: string
    icon?: string | null
    type: string
    target: string
    order: number
    is_visible: boolean
    category_id: number | null
    is_admin_only: boolean
    read_roles: Role[]
    write_roles: Role[]
  }) {
    const { data } = await api.post<Menu>('/menus', payload)
    return data
  },
  async update(
    id: number,
    payload: Partial<{
      label: string
      icon: string | null
      type: string
      target: string
      order: number
      is_visible: boolean
      category_id: number | null
      is_admin_only: boolean
      read_roles: Role[]
      write_roles: Role[]
    }>
  ) {
    const { data } = await api.patch<Menu>(`/menus/${id}`, payload)
    return data
  },
  async remove(id: number) {
    await api.delete(`/menus/${id}`)
  },
  async reorder(items: Array<{ id: number; order: number }>) {
    await api.patch('/menus/reorder', { items })
  },
}

export const menuCategoriesApi = {
  async list() {
    const { data } = await api.get<{ items: MenuCategory[] }>('/menu-categories')
    return data.items
  },
  async create(payload: { label: string; order: number; is_visible: boolean }) {
    const { data } = await api.post<MenuCategory>('/menu-categories', payload)
    return data
  },
  async remove(id: number) {
    await api.delete(`/menu-categories/${id}`)
  },
  async reorder(items: Array<{ id: number; order: number }>) {
    await api.patch('/menu-categories/reorder', { items })
  },
}

export const usersApi = {
  async list(params: { q?: string; page?: number; size?: number }) {
    const { data } = await api.get<Paginated<User>>('/users', { params })
    return data
  },
  async updateRole(id: number, role: Role) {
    const { data } = await api.patch<User>(`/users/${id}/role`, { role })
    return data
  },
  async updateActive(id: number, is_active: boolean) {
    const { data } = await api.patch<User>(`/users/${id}/active`, { is_active })
    return data
  },
  async myProfile() {
    const { data } = await api.get<MyProfileResponse>('/users/me/profile')
    return data
  },
  async changeMyPassword(payload: { current_password: string; new_password: string }) {
    await api.patch('/users/me/password', payload)
  },
  async withdrawMe() {
    await api.delete('/users/me/withdraw')
  },
}

export const statsApi = {
  async dashboard() {
    const { data } = await api.get<DashboardStats>('/stats/dashboard')
    return data
  },
  async monitoring(params?: { days?: number; month?: string }) {
    const { data } = await api.get<StatsMonitoring>('/stats/monitoring', { params })
    return data
  },
}

export const auditLogsApi = {
  async list(params: {
    q?: string
    method?: string
    status_code?: number
    is_success?: boolean
    from_at?: string
    to_at?: string
    page?: number
    size?: number
  }) {
    const { data } = await api.get<Paginated<AuditLogEntry>>('/audit-logs', { params })
    return data
  },
}
