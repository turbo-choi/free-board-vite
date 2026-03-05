import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Building2, ChevronDown } from 'lucide-react'

import { EmptyState } from '@/components/common/EmptyState'
import { MenuIcon } from '@/features/menus/iconRegistry'
import { useNavigationMenusQuery } from '@/features/menus/queries'
import { cn } from '@/lib/utils'
import type { NavigationMenuGroup, NavigationMenuItem } from '@/types/domain'

const CATEGORY_COLLAPSE_KEY = 'corpboard_sidebar_category_collapse'

interface SidebarNavProps {
  mobileOpen: boolean
  onMobileOpenChange: (open: boolean) => void
  collapsed: boolean
}

function getGroupKey(group: NavigationMenuGroup) {
  return group.category_id === null ? 'uncategorized' : String(group.category_id)
}

function readCollapsedGroups(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(CATEGORY_COLLAPSE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, boolean>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function persistCollapsedGroups(value: Record<string, boolean>) {
  localStorage.setItem(CATEGORY_COLLAPSE_KEY, JSON.stringify(value))
}

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-xl border border-sidebar-brand-border/35 bg-sidebar-brand/80',
        collapsed ? 'p-2' : 'gap-3 px-3 py-2'
      )}
      title={collapsed ? 'CorpBoard' : undefined}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Building2 className="h-5 w-5" />
      </div>
      {collapsed ? null : (
        <div className="min-w-0">
          <p className="truncate text-base font-extrabold leading-tight text-sidebar-foreground">CorpBoard</p>
          <p className="truncate text-[11px] text-sidebar-muted-foreground">Internal Bulletin</p>
        </div>
      )}
    </div>
  )
}

function SidebarSection({
  groups,
  pathname,
  collapsed,
  collapsedGroups,
  onToggleGroup,
  onLinkClick,
}: {
  groups: NavigationMenuGroup[]
  pathname: string
  collapsed: boolean
  collapsedGroups: Record<string, boolean>
  onToggleGroup: (groupKey: string) => void
  onLinkClick?: () => void
}) {
  if (groups.length === 0) {
    return <EmptyState title="메뉴가 없습니다." description="관리자 메뉴에서 메뉴를 추가하세요." />
  }

  const sortedGroups = [...groups].sort((a, b) => {
    if (a.category_id === null && b.category_id !== null) return -1
    if (a.category_id !== null && b.category_id === null) return 1
    return a.order - b.order
  })

  const uncategorizedGroup = sortedGroups.find((group) => group.category_id === null)
  const categorizedGroups = sortedGroups.filter((group) => group.category_id !== null)

  function renderMenuItem(item: NavigationMenuItem) {
    const active = pathname === item.target
    const isExternal =
      item.type === 'external' ||
      item.target.startsWith('http://') ||
      item.target.startsWith('https://') ||
      item.target.startsWith('mailto:')
    const itemClassName = cn(
      'flex items-center rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
      collapsed ? 'justify-center' : 'gap-3',
      active
        ? 'bg-primary/15 text-primary'
        : 'text-sidebar-muted-foreground hover:bg-sidebar-brand/60 hover:text-sidebar-foreground'
    )

    if (isExternal) {
      return (
        <a
          key={item.id}
          href={item.target}
          onClick={onLinkClick}
          title={collapsed ? item.label : undefined}
          className={itemClassName}
          target={item.target.startsWith('mailto:') ? undefined : '_blank'}
          rel={item.target.startsWith('mailto:') ? undefined : 'noreferrer'}
        >
          <MenuIcon iconKey={item.icon} target={item.target} type={item.type} className="h-4 w-4 shrink-0" />
          {collapsed ? null : <span className="truncate">{item.label}</span>}
        </a>
      )
    }

    return (
      <Link
        key={item.id}
        to={item.target}
        onClick={onLinkClick}
        title={collapsed ? item.label : undefined}
        className={itemClassName}
      >
        <MenuIcon iconKey={item.icon} target={item.target} type={item.type} className="h-4 w-4 shrink-0" />
        {collapsed ? null : <span className="truncate">{item.label}</span>}
      </Link>
    )
  }

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-3">
      {uncategorizedGroup ? <div className="mb-3 space-y-1">{uncategorizedGroup.items.map(renderMenuItem)}</div> : null}

      {categorizedGroups.map((group) => {
        const groupKey = getGroupKey(group)
        const groupCollapsed = collapsed ? false : collapsedGroups[groupKey] ?? false

        return (
          <section key={groupKey} className="mb-3">
            {!collapsed ? (
              <button
                type="button"
                className="mb-1 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted-foreground hover:bg-sidebar-brand/55 hover:text-sidebar-foreground"
                onClick={() => onToggleGroup(groupKey)}
              >
                <span>{group.category_label}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', groupCollapsed && '-rotate-90')} />
              </button>
            ) : null}

            {groupCollapsed ? null : <div className="space-y-1">{group.items.map(renderMenuItem)}</div>}
          </section>
        )
      })}
    </nav>
  )
}

export function SidebarNav({
  mobileOpen,
  onMobileOpenChange,
  collapsed,
}: SidebarNavProps) {
  const location = useLocation()
  const { data } = useNavigationMenusQuery()
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => readCollapsedGroups())

  const groups = useMemo(
    () => [...(data?.groups ?? [])].sort((a, b) => a.order - b.order),
    [data?.groups]
  )

  function toggleGroup(groupKey: string) {
    const next = { ...collapsedGroups, [groupKey]: !collapsedGroups[groupKey] }
    setCollapsedGroups(next)
    persistCollapsedGroups(next)
  }

  return (
    <>
      <aside
        className={cn(
          'hidden h-full flex-col border-r border-sidebar-border bg-sidebar/95 text-sidebar-foreground lg:flex',
          collapsed ? 'w-20' : 'w-[280px]'
        )}
      >
        <div className="flex h-16 items-center border-b border-sidebar-border px-3">
          <div className={cn('flex w-full items-center', collapsed ? 'justify-center' : 'justify-start')}>
            <SidebarBrand collapsed={collapsed} />
          </div>
        </div>
        <SidebarSection
          groups={groups}
          pathname={location.pathname}
          collapsed={collapsed}
          collapsedGroups={collapsedGroups}
          onToggleGroup={toggleGroup}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => onMobileOpenChange(false)} />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[280px] border-r border-sidebar-border bg-sidebar/95 text-sidebar-foreground shadow-2xl transition-transform duration-200 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <SidebarBrand collapsed={false} />
        </div>
        <SidebarSection
          groups={groups}
          pathname={location.pathname}
          collapsed={false}
          collapsedGroups={collapsedGroups}
          onToggleGroup={toggleGroup}
          onLinkClick={() => onMobileOpenChange(false)}
        />
      </aside>
    </>
  )
}
