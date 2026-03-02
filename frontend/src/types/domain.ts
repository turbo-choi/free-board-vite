export type Role = 'USER' | 'STAFF' | 'ADMIN'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  is_active: boolean
  created_at: string
  login_count?: number
}

export interface BoardSettings {
  allowAnonymous: boolean
  allowAttachment: boolean
  allowPin: boolean
}

export interface Board {
  id: number
  name: string
  slug: string
  description: string | null
  settings_json: BoardSettings
  created_at: string
}

export interface PostListItem {
  id: number
  board_id: number
  board_slug: string
  board_name: string
  title: string
  content_preview: string
  author_id: number
  author_name: string
  is_pinned: boolean
  view_count: number
  comment_count: number
  created_at: string
  updated_at: string
}

export interface Attachment {
  id: number
  post_id: number
  file_name: string
  mime_type: string
  size: number
  storage_path: string
  created_at: string
}

export interface PostDetail {
  id: number
  board_id: number
  board_slug: string
  board_name: string
  title: string
  content: string
  author_id: number
  author_name: string
  is_pinned: boolean
  view_count: number
  created_at: string
  updated_at: string
  attachments: Attachment[]
}

export interface Comment {
  id: number
  post_id: number
  content: string
  author: { id: number; name: string }
  created_at: string
  updated_at: string
}

export interface Menu {
  id: number
  label: string
  icon: string | null
  type: string
  target: string
  order: number
  is_visible: boolean
  category_id: number | null
  category_label: string | null
  is_admin_only: boolean
  read_roles: Role[]
  write_roles: Role[]
}

export interface MenuCategory {
  id: number
  label: string
  order: number
  is_visible: boolean
}

export interface NavigationMenuItem {
  id: number
  label: string
  icon: string | null
  type: string
  target: string
  order: number
  category_id: number | null
  can_write: boolean
}

export interface NavigationMenuGroup {
  category_id: number | null
  category_label: string
  order: number
  items: NavigationMenuItem[]
}

export interface NavigationMenuResponse {
  groups: NavigationMenuGroup[]
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  size: number
}

export interface MyProfileResponse {
  user: User
  stats: {
    login_count: number
    post_count: number
    comment_count: number
  }
}

export interface StatsSummary {
  total_members: number
  active_members: number
  withdrawn_members: number
  total_posts: number
  total_comments: number
}

export interface DailyStatsItem {
  date: string
  cumulative_members: number
  withdrawn_members: number
  posts: number
  comments: number
}

export interface BoardPostCountItem {
  board_id: number
  board_slug: string
  board_name: string
  post_count: number
}

export interface StatsMonitoring {
  summary: StatsSummary
  daily: DailyStatsItem[]
  board_post_counts: BoardPostCountItem[]
}

export interface AuditLogEntry {
  id: number
  user_id: number | null
  user_email: string | null
  user_role: Role | null
  method: string
  path: string
  query_string: string | null
  status_code: number
  is_success: boolean
  latency_ms: number
  ip_address: string | null
  user_agent: string | null
  created_at: string
}
