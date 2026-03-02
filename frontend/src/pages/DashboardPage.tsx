import { type ReactNode, useMemo } from 'react'
import { format } from 'date-fns'
import { useLocation, useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { MessageSquare, Pin, TrendingUp } from 'lucide-react'

import { DataTable } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingBlock } from '@/components/common/LoadingBlock'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePostsQuery } from '@/features/posts/queries'
import type { PostListItem } from '@/types/domain'

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
  const noticeQuery = usePostsQuery({ boardSlug: 'notice', page: 1, size: 5, sort: 'latest' })
  const allQuery = usePostsQuery({ page: 1, size: 100, sort: 'latest' })

  const today = new Date().toDateString()

  const stats = useMemo(() => {
    const posts = allQuery.data?.items ?? []
    const todaysPosts = posts.filter((post) => new Date(post.created_at).toDateString() === today)
    const todaysComments = todaysPosts.reduce((sum, post) => sum + post.comment_count, 0)
    const unanswered = posts.filter((post) => post.board_slug === 'qa' && post.comment_count === 0).length
    const pinned = posts.filter((post) => post.is_pinned).length

    return {
      todaysPosts: todaysPosts.length,
      todaysComments,
      unanswered,
      pinned,
    }
  }, [allQuery.data?.items, today])

  const columns: ColumnDef<PostListItem>[] = [
    {
      accessorKey: 'title',
      header: '제목',
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
      header: '작성일',
      cell: ({ row }) => format(new Date(row.original.created_at), 'yyyy-MM-dd'),
    },
    {
      accessorKey: 'is_pinned',
      header: '상태',
      cell: ({ row }) =>
        row.original.is_pinned ? <Badge variant="warning">Pinned</Badge> : <Badge variant="outline">Normal</Badge>,
    },
  ]

  if (noticeQuery.isLoading || allQuery.isLoading) {
    return <LoadingBlock />
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Today's Posts" value={stats.todaysPosts} note="오늘 작성된 게시글" icon={<TrendingUp />} />
        <StatCard title="Today's Comments" value={stats.todaysComments} note="오늘 게시글 기준 댓글 수" icon={<MessageSquare />} />
        <StatCard title="Unanswered Q&A" value={stats.unanswered} note="댓글 없는 QA" icon={<MessageSquare />} />
        <StatCard title="Pinned Notices" value={stats.pinned} note="고정된 게시글" icon={<Pin />} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-3 xl:col-span-2">
          <h2 className="text-lg font-bold">Recent Notices</h2>
          {(noticeQuery.data?.items.length ?? 0) > 0 ? (
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
          ) : (
            <EmptyState title="공지 게시글이 없습니다." />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Employee Handbook</p>
            <p>• IT Help Desk</p>
            <p>• Meeting Rooms</p>
            <p>• Learning Portal</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
