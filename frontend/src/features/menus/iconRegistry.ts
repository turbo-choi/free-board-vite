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
  { value: 'layout-dashboard', label: '대시보드', Icon: LayoutDashboard },
  { value: 'home', label: '홈', Icon: Home },
  { value: 'bell', label: '알림/공지', Icon: Bell },
  { value: 'megaphone', label: '확성기', Icon: Megaphone },
  { value: 'newspaper', label: '뉴스', Icon: Newspaper },
  { value: 'book-open', label: '책/문서', Icon: BookOpen },
  { value: 'folder-kanban', label: '자료실', Icon: FolderKanban },
  { value: 'folder-open', label: '폴더', Icon: FolderOpen },
  { value: 'file-text', label: '텍스트 파일', Icon: FileText },
  { value: 'files', label: '파일 묶음', Icon: Files },
  { value: 'archive', label: '보관함', Icon: Archive },
  { value: 'help-circle', label: '도움말/Q&A', Icon: HelpCircle },
  { value: 'message-square', label: '댓글/토론', Icon: MessageSquare },
  { value: 'message-circle', label: '메시지', Icon: MessageCircle },
  { value: 'users', label: '사용자 그룹', Icon: Users },
  { value: 'users-round', label: '회원', Icon: UsersRound },
  { value: 'user-round', label: '사용자', Icon: UserRound },
  { value: 'briefcase', label: '업무', Icon: Briefcase },
  { value: 'building-2', label: '회사/조직', Icon: Building2 },
  { value: 'calendar-days', label: '일정', Icon: CalendarDays },
  { value: 'clipboard-list', label: '목록/체크', Icon: ClipboardList },
  { value: 'chart-column', label: '막대 차트', Icon: ChartColumn },
  { value: 'chart-pie', label: '파이 차트', Icon: ChartPie },
  { value: 'bar-chart-3', label: '분석', Icon: BarChart3 },
  { value: 'trending-up', label: '상승 추세', Icon: TrendingUp },
  { value: 'activity', label: '활동', Icon: Activity },
  { value: 'database', label: '데이터', Icon: Database },
  { value: 'search', label: '검색', Icon: Search },
  { value: 'star', label: '즐겨찾기', Icon: Star },
  { value: 'bookmark', label: '북마크', Icon: Bookmark },
  { value: 'pin', label: '핀', Icon: Pin },
  { value: 'flag', label: '깃발', Icon: Flag },
  { value: 'globe', label: '글로벌', Icon: Globe },
  { value: 'link-2', label: '링크', Icon: Link2 },
  { value: 'shield', label: '보안/관리자', Icon: Shield },
  { value: 'settings', label: '설정', Icon: Settings },
  { value: 'wrench', label: '도구', Icon: Wrench },
  { value: 'life-buoy', label: '지원', Icon: LifeBuoy },
  { value: 'mail', label: '메일', Icon: Mail },
  { value: 'phone', label: '전화', Icon: Phone },
  { value: 'layout-grid', label: '그리드', Icon: LayoutGrid },
  { value: 'menu-square', label: '메뉴', Icon: MenuSquare },
  { value: 'laptop', label: '시스템', Icon: Laptop },
  { value: 'shopping-bag', label: '구매/상점', Icon: ShoppingBag },
  { value: 'package', label: '패키지', Icon: Package },
  { value: 'graduation-cap', label: '교육', Icon: GraduationCap },
  { value: 'rocket', label: '프로젝트', Icon: Rocket },
] as const

const MENU_ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  MENU_ICON_OPTIONS.map((option) => [option.value, option.Icon])
)

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

export function getMenuIcon(
  iconKey: string | null | undefined,
  target: string,
  type: string
): LucideIcon {
  if (iconKey) {
    const normalized = iconKey.trim()
    if (normalized && MENU_ICON_MAP[normalized]) {
      return MENU_ICON_MAP[normalized]
    }
  }
  return getFallbackIconByTarget(target, type)
}
