import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Archive,
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  Briefcase,
  Building2,
  CalendarDays,
  ChartColumn,
  ChartPie,
  ClipboardList,
  Database,
  FileText,
  Files,
  Flag,
  FolderKanban,
  FolderOpen,
  Globe,
  GraduationCap,
  HelpCircle,
  Home,
  Laptop,
  LayoutDashboard,
  LayoutGrid,
  LifeBuoy,
  Link2,
  Mail,
  Megaphone,
  MenuSquare,
  MessageCircle,
  MessageSquare,
  Newspaper,
  Package,
  Phone,
  Pin,
  Rocket,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Star,
  TrendingUp,
  UserRound,
  Users,
  UsersRound,
  Wrench,
} from 'lucide-react'

export const MENU_ICON_OPTIONS = [
  { value: 'layout-dashboard', label: '대시보드' },
  { value: 'home', label: '홈' },
  { value: 'bell', label: '알림/공지' },
  { value: 'megaphone', label: '확성기' },
  { value: 'newspaper', label: '뉴스' },
  { value: 'book-open', label: '책/문서' },
  { value: 'folder-kanban', label: '자료실' },
  { value: 'folder-open', label: '폴더' },
  { value: 'file-text', label: '텍스트 파일' },
  { value: 'files', label: '파일 묶음' },
  { value: 'archive', label: '보관함' },
  { value: 'help-circle', label: '도움말/Q&A' },
  { value: 'message-square', label: '댓글/토론' },
  { value: 'message-circle', label: '메시지' },
  { value: 'users', label: '사용자 그룹' },
  { value: 'users-round', label: '회원' },
  { value: 'user-round', label: '사용자' },
  { value: 'briefcase', label: '업무' },
  { value: 'building-2', label: '회사/조직' },
  { value: 'calendar-days', label: '일정' },
  { value: 'clipboard-list', label: '목록/체크' },
  { value: 'chart-column', label: '막대 차트' },
  { value: 'chart-pie', label: '파이 차트' },
  { value: 'bar-chart-3', label: '분석' },
  { value: 'trending-up', label: '상승 추세' },
  { value: 'activity', label: '활동' },
  { value: 'database', label: '데이터' },
  { value: 'search', label: '검색' },
  { value: 'star', label: '즐겨찾기' },
  { value: 'bookmark', label: '북마크' },
  { value: 'pin', label: '핀' },
  { value: 'flag', label: '깃발' },
  { value: 'globe', label: '글로벌' },
  { value: 'link-2', label: '링크' },
  { value: 'shield', label: '보안/관리자' },
  { value: 'settings', label: '설정' },
  { value: 'wrench', label: '도구' },
  { value: 'life-buoy', label: '지원' },
  { value: 'mail', label: '메일' },
  { value: 'phone', label: '전화' },
  { value: 'layout-grid', label: '그리드' },
  { value: 'menu-square', label: '메뉴' },
  { value: 'laptop', label: '시스템' },
  { value: 'shopping-bag', label: '구매/상점' },
  { value: 'package', label: '패키지' },
  { value: 'graduation-cap', label: '교육' },
  { value: 'rocket', label: '프로젝트' },
] as const

const MENU_ICON_MAP: Record<string, LucideIcon> = {
  activity: Activity,
  archive: Archive,
  'bar-chart-3': BarChart3,
  bell: Bell,
  'book-open': BookOpen,
  bookmark: Bookmark,
  briefcase: Briefcase,
  'building-2': Building2,
  'calendar-days': CalendarDays,
  'chart-column': ChartColumn,
  'chart-pie': ChartPie,
  'clipboard-list': ClipboardList,
  database: Database,
  'file-text': FileText,
  files: Files,
  flag: Flag,
  'folder-kanban': FolderKanban,
  'folder-open': FolderOpen,
  globe: Globe,
  'graduation-cap': GraduationCap,
  'help-circle': HelpCircle,
  home: Home,
  laptop: Laptop,
  'layout-dashboard': LayoutDashboard,
  'layout-grid': LayoutGrid,
  'life-buoy': LifeBuoy,
  'link-2': Link2,
  mail: Mail,
  megaphone: Megaphone,
  'menu-square': MenuSquare,
  'message-circle': MessageCircle,
  'message-square': MessageSquare,
  newspaper: Newspaper,
  package: Package,
  phone: Phone,
  pin: Pin,
  rocket: Rocket,
  search: Search,
  settings: Settings,
  shield: Shield,
  'shopping-bag': ShoppingBag,
  star: Star,
  'trending-up': TrendingUp,
  'user-round': UserRound,
  users: Users,
  'users-round': UsersRound,
  wrench: Wrench,
}

function getFallbackIconByTarget(target: string, type: string): LucideIcon {
  if (target === '/dashboard') return LayoutDashboard
  if (target === '/boards/notice') return Bell
  if (target === '/boards/free') return Users
  if (target === '/boards/archive') return FolderKanban
  if (target === '/boards/qa') return HelpCircle
  if (target === '/stats/monitoring') return ChartColumn
  if (target === '/admin/audit-logs') return Activity
  if (target.startsWith('/admin/')) return Shield
  if (type === 'external') return LifeBuoy
  return BookOpen
}

function normalizeIconKey(iconKey: string | null | undefined) {
  const normalized = iconKey?.trim() ?? ''
  return normalized.length > 0 ? normalized : null
}

function resolveMenuIcon(
  iconKey: string | null | undefined,
  target: string,
  type: string
): LucideIcon {
  const normalized = normalizeIconKey(iconKey)
  if (normalized && MENU_ICON_MAP[normalized]) {
    return MENU_ICON_MAP[normalized]
  }
  return getFallbackIconByTarget(target, type)
}

export function MenuIcon({
  iconKey,
  target,
  type,
  className,
}: {
  iconKey: string | null | undefined
  target: string
  type: string
  className?: string
}) {
  const Icon = resolveMenuIcon(iconKey, target, type)
  return <Icon className={className} />
}
