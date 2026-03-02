import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { RefreshCw } from 'lucide-react'

import { DataTable } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingBlock } from '@/components/common/LoadingBlock'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuditLogsQuery } from '@/features/audit-logs/queries'
import { formatApiDate } from '@/lib/datetime'
import type { AuditLogEntry } from '@/types/domain'

const PAGE_SIZE = 20

interface FilterState {
  q: string
  method: string
  status_code: string
  is_success: string
  from_at: string
  to_at: string
}

const defaultFilterState: FilterState = {
  q: '',
  method: '',
  status_code: '',
  is_success: '',
  from_at: '',
  to_at: '',
}

export function AdminAuditLogsPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<FilterState>(defaultFilterState)
  const [qInput, setQInput] = useState(defaultFilterState.q)

  const queryParams = useMemo(
    () => ({
      q: filters.q.trim() || undefined,
      method: filters.method || undefined,
      status_code: filters.status_code ? Number(filters.status_code) : undefined,
      is_success: filters.is_success === '' ? undefined : filters.is_success === 'true',
      from_at: filters.from_at || undefined,
      to_at: filters.to_at || undefined,
      page,
      size: PAGE_SIZE,
    }),
    [filters, page]
  )
  const auditLogsQuery = useAuditLogsQuery(queryParams)

  const applyKeywordFilter = () => {
    setPage(1)
    setFilters((prev) => ({ ...prev, q: qInput }))
  }

  const totalPages = Math.max(1, Math.ceil((auditLogsQuery.data?.total ?? 0) / PAGE_SIZE))
  const canNextPage = page < totalPages

  const columns: ColumnDef<AuditLogEntry>[] = useMemo(
    () => [
      {
        accessorKey: 'created_at',
        header: '발생 시각',
        cell: ({ row }) => formatApiDate(row.original.created_at, 'yyyy-MM-dd HH:mm:ss'),
      },
      {
        id: 'actor',
        header: '사용자',
        cell: ({ row }) => (
          <div className="space-y-0.5 text-xs">
            <p className="font-semibold">{row.original.user_email ?? '비회원/알수없음'}</p>
            <p className="text-muted-foreground">{row.original.user_role ?? '-'}</p>
          </div>
        ),
      },
      {
        id: 'request',
        header: '요청',
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{row.original.method}</Badge>
              <span className="font-mono text-xs">{row.original.path}</span>
            </div>
            {row.original.query_string ? (
              <p className="line-clamp-1 text-[11px] text-muted-foreground">
                ?{row.original.query_string}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: 'result',
        header: '결과',
        cell: ({ row }) => (
          <Badge variant={row.original.is_success ? 'success' : 'destructive'}>
            {row.original.status_code}
          </Badge>
        ),
      },
      {
        accessorKey: 'latency_ms',
        header: '응답시간',
        cell: ({ row }) => `${row.original.latency_ms} ms`,
      },
      {
        accessorKey: 'ip_address',
        header: 'IP',
        cell: ({ row }) => row.original.ip_address ?? '-',
      },
      {
        accessorKey: 'user_agent',
        header: 'User-Agent',
        cell: ({ row }) => (
          <p className="max-w-[260px] truncate text-xs text-muted-foreground" title={row.original.user_agent ?? '-'}>
            {row.original.user_agent ?? '-'}
          </p>
        ),
      },
    ],
    []
  )

  if (auditLogsQuery.isLoading) {
    return <LoadingBlock label="감사 로그를 불러오는 중..." />
  }

  if (auditLogsQuery.isError || !auditLogsQuery.data) {
    return <EmptyState title="감사 로그를 불러오지 못했습니다." description="잠시 후 다시 시도해주세요." />
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="rounded-xl border border-border/70 bg-card/70 p-4">
        <p className="mb-3 text-sm font-semibold">로그 필터</p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6">
          <Input
            placeholder="경로/이메일/IP 검색"
            value={qInput}
            onChange={(event) => {
              setQInput(event.target.value)
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              if (event.nativeEvent.isComposing) return
              event.preventDefault()
              applyKeywordFilter()
            }}
          />

          <select
            className="h-10 rounded-md border border-input bg-card px-3 text-sm"
            value={filters.method}
            onChange={(event) => {
              setPage(1)
              setFilters((prev) => ({ ...prev, method: event.target.value }))
            }}
          >
            <option value="">메서드 전체</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PATCH">PATCH</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>

          <Input
            type="number"
            min={100}
            max={599}
            placeholder="상태코드"
            value={filters.status_code}
            onChange={(event) => {
              setPage(1)
              setFilters((prev) => ({ ...prev, status_code: event.target.value }))
            }}
          />

          <select
            className="h-10 rounded-md border border-input bg-card px-3 text-sm"
            value={filters.is_success}
            onChange={(event) => {
              setPage(1)
              setFilters((prev) => ({ ...prev, is_success: event.target.value }))
            }}
          >
            <option value="">성공/실패 전체</option>
            <option value="true">성공</option>
            <option value="false">실패</option>
          </select>

          <Input
            type="datetime-local"
            value={filters.from_at}
            onChange={(event) => {
              setPage(1)
              setFilters((prev) => ({ ...prev, from_at: event.target.value }))
            }}
          />

          <Input
            type="datetime-local"
            value={filters.to_at}
            onChange={(event) => {
              setPage(1)
              setFilters((prev) => ({ ...prev, to_at: event.target.value }))
            }}
          />
        </div>

        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setPage(1)
              setFilters(defaultFilterState)
              setQInput(defaultFilterState.q)
            }}
          >
            필터 초기화
          </Button>
          <Button variant="outline" onClick={() => auditLogsQuery.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
        </div>
      </div>

      {auditLogsQuery.data.items.length > 0 ? (
        <DataTable data={auditLogsQuery.data.items} columns={columns} />
      ) : (
        <EmptyState title="조회된 로그가 없습니다." />
      )}

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>
          이전
        </Button>
        <span className="text-sm text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button variant="outline" disabled={!canNextPage} onClick={() => setPage((prev) => prev + 1)}>
          다음
        </Button>
      </div>
    </div>
  )
}
