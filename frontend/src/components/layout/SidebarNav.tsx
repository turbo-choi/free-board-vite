import { type ComponentType, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'

import { EmptyState } from '@/components/common/EmptyState'
import { useNavigationMenusQuery } from '@/features/menus/queries'
import { getMenuIcon } from '@/features/menus/iconRegistry'
import { cn } from '@/lib/utils'
import type { NavigationMenuGroup, NavigationMenuItem } from '@/types/domain'

const CATEGORY_COLLAPSE_KEY = 'corpboard_sidebar_category_collapse'

interface SidebarNavProps {
  mobileOpen: boolean
  onMobileOpenChange: (open: boolean) => void
  collapsed: boolean
}

function getIcon(item: NavigationMenuItem): ComponentType<{ className?: string }> {
  return getMenuIcon(item.icon, item.target, item.type)
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
    const Icon = getIcon(item)
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
        : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
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
          <Icon className="h-4 w-4 shrink-0" />
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
        <Icon className="h-4 w-4 shrink-0" />
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
                className="mb-1 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-secondary/60"
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
          'hidden h-full flex-col border-r border-border bg-[#172338]/95 lg:flex',
          collapsed ? 'w-20' : 'w-[280px]'
        )}
      >
        <div className="flex h-16 items-center border-b border-border px-3">
          <div className={cn('flex w-full items-center', collapsed ? 'justify-center' : 'justify-start')}>
            <div className={cn('inline-flex items-center rounded-xl border border-primary/20 bg-primary/10', collapsed ? 'p-2' : 'gap-3 px-3 py-2')}>
              <div className="h-8 w-8 rounded-lg bg-primary/90" />
              {collapsed ? null : (
                <div>
                  <p className="text-base font-extrabold">CorpBoard</p>
                  <p className="text-[11px] text-muted-foreground">Internal Bulletin</p>
                </div>
              )}
            </div>
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
          'fixed inset-y-0 left-0 z-50 w-[280px] border-r border-border bg-[#172338]/95 shadow-2xl transition-transform duration-200 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center border-b border-border px-4">
          <div className="inline-flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2">
            <div className="h-8 w-8 rounded-lg bg-primary/90" />
            <div>
              <p className="text-base font-extrabold">CorpBoard</p>
              <p className="text-[11px] text-muted-foreground">Internal Bulletin</p>
            </div>
          </div>
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
