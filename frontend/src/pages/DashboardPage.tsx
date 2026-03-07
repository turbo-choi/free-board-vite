import { type ReactNode, useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpRight, MessageSquare, Pin, TrendingUp } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { DataTable } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingBlock } from '@/components/common/LoadingBlock'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getMenuAccess } from '@/features/menus/permissions'
import { useNavigationMenusQuery } from '@/features/menus/queries'
import { usePostsQuery } from '@/features/posts/queries'
import { useDashboardStatsQuery } from '@/features/stats/queries'
import { formatApiDate } from '@/lib/datetime'
import type { DashboardStats, PostListItem } from '@/types/domain'

const QUICK_LINK_SAMPLES = [
  { label: 'Employee Handbook', href: 'https://www.google.com' },
  { label: 'IT Help Desk', href: 'https://www.google.com' },
  { label: 'Meeting Rooms', href: 'https://www.google.com' },
  { label: 'Mattermost', href: 'https://mattermost.technet.com/' },
  { label: 'DAPLINK', href: 'http://localhost:3001' },
] as const

function StatCard({
  title,
  value,
  note,
  icon,
}: {
  title: string
  value: string | number
  note: string
  icon: ReactNode
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-3xl font-extrabold">{value}</p>
        <p className="mt-2 text-xs text-muted-foreground">{note}</p>
      </CardContent>
      <div className="absolute right-4 top-4 text-primary/25">{icon}</div>
    </Card>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const navigationMenusQuery = useNavigationMenusQuery()
  const dashboardStatsQuery = useDashboardStatsQuery()
  const noticeAccess = useMemo(
    () => getMenuAccess(navigationMenusQuery.data?.groups, '/boards/notice'),
    [navigationMenusQuery.data?.groups]
  )
  const canReadNotice = noticeAccess.canRead
  const noticeQuery = usePostsQuery(
    { boardSlug: 'notice', page: 1, size: 5, sort: 'latest' },
    { enabled: !navigationMenusQuery.isLoading && canReadNotice }
  )
  const stats: DashboardStats = dashboardStatsQuery.data ?? {
    today_posts: 0,
    today_comments: 0,
    unanswered_qa_count: 0,
    pinned_notice_count: 0,
  }

  const columns = useMemo<ColumnDef<PostListItem>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => {
          const post = row.original
          return (
            <div>
              <p className="font-semibold">{post.title}</p>
              <p className="text-xs text-muted-foreground">{post.author_name}</p>
            </div>
          )
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ row }) => formatApiDate(row.original.created_at, 'yyyy-MM-dd'),
      },
      {
        accessorKey: 'is_pinned',
        header: 'Status',
        cell: ({ row }) =>
          row.original.is_pinned ? <Badge variant="warning">Pinned</Badge> : <Badge variant="outline">Normal</Badge>,
      },
    ],
    []
  )

  if (navigationMenusQuery.isLoading || dashboardStatsQuery.isLoading || noticeQuery.isLoading) {
    return <LoadingBlock />
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Posts"
          value={stats.today_posts}
          note="Posts created today in readable boards"
          icon={<TrendingUp />}
        />
        <StatCard
          title="Today's Comments"
          value={stats.today_comments}
          note="Comments attached to today's readable posts"
          icon={<MessageSquare />}
        />
        <StatCard
          title="Unanswered Q&A"
          value={stats.unanswered_qa_count}
          note="Readable Q&A posts without comments"
          icon={<MessageSquare />}
        />
        <StatCard
          title="Pinned Notices"
          value={stats.pinned_notice_count}
          note="Pinned posts in the readable notice board"
          icon={<Pin />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-3 xl:col-span-2">
          <h2 className="text-lg font-bold">Recent Notices</h2>
          {canReadNotice && (noticeQuery.data?.items.length ?? 0) > 0 ? (
            <DataTable
              data={noticeQuery.data?.items ?? []}
              columns={columns}
              onRowClick={(post) =>
                navigate(`/posts/${post.id}`, {
                  state: {
                    fromPath: `${location.pathname}${location.search}`,
                  },
                })
              }
            />
          ) : canReadNotice && noticeQuery.isError ? (
            <EmptyState title="Unable to load recent notices." />
          ) : canReadNotice ? (
            <EmptyState title="No notices available." />
          ) : (
            <EmptyState title="Notice board is unavailable." />
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold">Quick Links</h2>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <ul className="divide-y divide-border/70">
                {QUICK_LINK_SAMPLES.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary/45 hover:text-foreground"
                    >
                      <span>{link.label}</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
