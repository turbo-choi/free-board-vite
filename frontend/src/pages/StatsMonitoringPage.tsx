import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import type { ColumnDef } from '@tanstack/react-table'
import { BarChart3, FileText, MessageSquareText, UserCheck, UserX } from 'lucide-react'

import { DataTable } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingBlock } from '@/components/common/LoadingBlock'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStatsMonitoringQuery } from '@/features/stats/queries'
import type { BoardPostCountItem, DailyStatsItem } from '@/types/domain'

const dayOptions = [
  { label: '최근 7일', value: 7 },
  { label: '최근 30일', value: 30 },
  { label: '최근 90일', value: 90 },
]

type ChartMetricKey = 'cumulative_members' | 'withdrawn_members' | 'posts' | 'comments'

const chartMetricOptions: Array<{ key: ChartMetricKey; label: string; color: string }> = [
  { key: 'cumulative_members', label: '누적회원', color: '#3b82f6' },
  { key: 'withdrawn_members', label: '탈퇴회원', color: '#f59e0b' },
  { key: 'posts', label: '게시글', color: '#10b981' },
  { key: 'comments', label: '댓글', color: '#8b5cf6' },
]

export function StatsMonitoringPage() {
  const [viewMode, setViewMode] = useState<'month' | 'rolling'>('month')
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [days, setDays] = useState(30)
  const [chartMetric, setChartMetric] = useState<ChartMetricKey>('posts')

  const statsQuery = useStatsMonitoringQuery(
    viewMode === 'month' ? { month: selectedMonth } : { days }
  )

  const dailyColumns: ColumnDef<DailyStatsItem>[] = [
    {
      accessorKey: 'date',
      header: '일자',
      cell: ({ row }) => format(new Date(row.original.date), 'yyyy-MM-dd'),
    },
    {
      accessorKey: 'cumulative_members',
      header: '일별 누적회원',
    },
    {
      accessorKey: 'withdrawn_members',
      header: '일별 탈퇴회원',
    },
    {
      accessorKey: 'posts',
      header: '일별 게시글',
    },
    {
      accessorKey: 'comments',
      header: '일별 댓글',
    },
  ]

  const boardColumns: ColumnDef<BoardPostCountItem>[] = [
    { accessorKey: 'board_name', header: '게시판' },
    { accessorKey: 'board_slug', header: '슬러그' },
    { accessorKey: 'post_count', header: '게시글 수' },
  ]

  const maxBoardPostCount = useMemo(() => {
    const items = statsQuery.data?.board_post_counts ?? []
    return Math.max(1, ...items.map((item) => item.post_count))
  }, [statsQuery.data?.board_post_counts])

  const selectedMetric = useMemo(
    () => chartMetricOptions.find((option) => option.key === chartMetric) ?? chartMetricOptions[0],
    [chartMetric]
  )

  const chartStats = useMemo(() => {
    const items = statsQuery.data?.daily ?? []
    const max = Math.max(1, ...items.map((item) => Number(item[chartMetric])))
    return { items, max }
  }, [chartMetric, statsQuery.data?.daily])

  if (statsQuery.isLoading) {
    return <LoadingBlock label="통계 데이터를 불러오는 중..." />
  }

  if (statsQuery.isError || !statsQuery.data) {
    return <EmptyState title="통계 데이터를 불러오지 못했습니다." description="잠시 후 다시 시도해주세요." />
  }

  const { summary, daily, board_post_counts: boardPostCounts } = statsQuery.data

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">통계관리-일별</h2>
          <p className="text-sm text-muted-foreground">회원/게시글/댓글 활동 지표를 월 단위 또는 최근 일수 기준으로 확인합니다.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            onClick={() => setViewMode('month')}
          >
            월 단위
          </Button>
          <Button
            variant={viewMode === 'rolling' ? 'default' : 'outline'}
            onClick={() => setViewMode('rolling')}
          >
            최근 일수
          </Button>

          {viewMode === 'month' ? (
            <input
              type="month"
              className="h-10 rounded-md border border-input bg-card px-3 text-sm"
              value={selectedMonth}
              max={format(new Date(), 'yyyy-MM')}
              onChange={(event) => setSelectedMonth(event.target.value)}
            />
          ) : (
            <select
              className="h-10 rounded-md border border-input bg-card px-3 text-sm"
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            >
              {dayOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">총 회원</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-extrabold">{summary.total_members}</p>
            <UserCheck className="h-5 w-5 text-primary/70" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">활성 회원</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-extrabold">{summary.active_members}</p>
            <UserCheck className="h-5 w-5 text-emerald-400" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">탈퇴(비활성) 회원</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-extrabold">{summary.withdrawn_members}</p>
            <UserX className="h-5 w-5 text-amber-400" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">총 게시글</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-extrabold">{summary.total_posts}</p>
            <FileText className="h-5 w-5 text-primary/70" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">총 댓글</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-extrabold">{summary.total_comments}</p>
            <MessageSquareText className="h-5 w-5 text-primary/70" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            {viewMode === 'month'
              ? `${selectedMonth} 월 일별 그래프`
              : `최근 ${days}일 일별 그래프`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {chartMetricOptions.map((option) => (
              <Button
                key={option.key}
                variant={chartMetric === option.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartMetric(option.key)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {chartStats.items.length > 0 ? (
            <div className="rounded-lg border border-border/70 bg-card/40 p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{selectedMetric.label} (최대: {chartStats.max})</span>
                <span>일자</span>
              </div>

              <div className="overflow-x-auto overflow-y-visible">
                <div className="flex min-w-[680px] gap-1">
                  {chartStats.items.map((item, index) => {
                    const value = Number(item[chartMetric])
                    const ratio = (value / chartStats.max) * 100
                    const heightPx = Math.max((ratio / 100) * 180, 2)
                    const dayLabel = format(new Date(item.date), 'd')
                    const showDayLabel =
                      index === 0 ||
                      index === chartStats.items.length - 1 ||
                      Number(dayLabel) % 5 === 0

                    return (
                      <div key={item.date} className="group relative flex min-w-[16px] flex-1 flex-col">
                        <div className="pointer-events-none absolute left-1/2 top-1 z-10 -translate-x-1/2 rounded-md border border-border/80 bg-background/95 px-2 py-1 text-[11px] text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                          <p className="whitespace-nowrap">{format(new Date(item.date), 'yyyy-MM-dd')}</p>
                          <p className="whitespace-nowrap text-muted-foreground">
                            {selectedMetric.label}: {value.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex h-[180px] items-end">
                          <div
                            className="w-full rounded-t-sm"
                            style={{
                              height: `${heightPx}px`,
                              backgroundColor: selectedMetric.color,
                            }}
                          />
                        </div>
                        <div className="mt-1 h-3 text-center text-[10px] leading-3 text-muted-foreground">
                          {showDayLabel ? dayLabel : '\u00A0'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="표시할 그래프 데이터가 없습니다." />
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">일별 지표</h3>
        {daily.length > 0 ? (
          <DataTable data={[...daily].reverse()} columns={dailyColumns} />
        ) : (
          <EmptyState title="표시할 일별 데이터가 없습니다." />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">게시판별 게시글 수</h3>
          {boardPostCounts.length > 0 ? (
            <DataTable data={boardPostCounts} columns={boardColumns} />
          ) : (
            <EmptyState title="게시판 데이터가 없습니다." />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              게시판 분포
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {boardPostCounts.map((item) => {
              const ratio = (item.post_count / maxBoardPostCount) * 100
              return (
                <div key={item.board_id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.board_name}</span>
                    <span className="text-muted-foreground">{item.post_count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary/60">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(ratio, 2)}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
