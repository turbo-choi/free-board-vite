import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'

import { DataTable } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingBlock } from '@/components/common/LoadingBlock'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBoardsQuery } from '@/features/boards/queries'
import { useNavigationMenusQuery } from '@/features/menus/queries'
import { getMenuAccess } from '@/features/menus/permissions'
import { usePostsQuery } from '@/features/posts/queries'
import { useAuth } from '@/hooks/useAuth'
import type { PostListItem } from '@/types/domain'

export function BoardListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { slug } = useParams()
  const { user } = useAuth()

  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'latest' | 'view' | 'comment'>('latest')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const boardsQuery = useBoardsQuery()
  const navigationMenusQuery = useNavigationMenusQuery()
  const postsQuery = usePostsQuery({
    boardSlug: slug,
    q: q || undefined,
    sort,
    page,
    size: 10,
    from: from || undefined,
    to: to || undefined,
  })

  const board = useMemo(
    () => boardsQuery.data?.find((item) => item.slug === slug),
    [boardsQuery.data, slug]
  )
  const boardTarget = slug ? `/boards/${slug}` : ''
  const boardAccess = useMemo(
    () => getMenuAccess(navigationMenusQuery.data?.groups, boardTarget),
    [boardTarget, navigationMenusQuery.data?.groups]
  )
  const canReadBoard = boardAccess.canRead || user?.role === 'ADMIN'
  const canWriteBoard = boardAccess.canWrite || (user?.role === 'ADMIN' && !boardAccess.canRead)

  const handleResetFilters = () => {
    setQInput('')
    setQ('')
    setSort('latest')
    setFrom('')
    setTo('')
    setPage(1)
    toast.success('필터를 초기화했습니다.')
  }

  const handleApplySearch = () => {
    setPage(1)
    setQ(qInput)
  }

  const columns: ColumnDef<PostListItem>[] = [
    {
      accessorKey: 'title',
      header: '제목',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold">{row.original.title}</p>
          <p className="text-xs text-muted-foreground">{row.original.content_preview}</p>
        </div>
      ),
    },
    {
      accessorKey: 'author_name',
      header: '작성자',
    },
    {
      accessorKey: 'view_count',
      header: '조회',
    },
    {
      accessorKey: 'comment_count',
      header: '댓글',
    },
    {
      accessorKey: 'created_at',
      header: '작성일',
      cell: ({ row }) => format(new Date(row.original.created_at), 'yyyy-MM-dd'),
    },
    {
      id: 'status',
      header: '상태',
      cell: ({ row }) =>
        row.original.is_pinned ? <Badge variant="warning">Pinned</Badge> : <Badge variant="outline">Normal</Badge>,
    },
  ]

  if (boardsQuery.isLoading || postsQuery.isLoading || navigationMenusQuery.isLoading) {
    return <LoadingBlock />
  }

  if (!canReadBoard) {
    return <EmptyState title="읽기 권한이 없습니다." description="관리자에게 권한을 요청하세요." />
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{board?.name ?? slug} 게시판</h2>
          <p className="text-sm text-muted-foreground">{board?.description ?? '게시글 목록'}</p>
        </div>
        {canWriteBoard ? <Button onClick={() => navigate(`/write?board=${slug}`)}>글쓰기</Button> : null}
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/60 bg-card/70 p-4 md:grid-cols-12">
        <Input
          className="md:col-span-4"
          value={qInput}
          onChange={(event) => setQInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            if (event.nativeEvent.isComposing) return
            event.preventDefault()
            handleApplySearch()
          }}
          placeholder="제목/내용/작성자 검색"
        />
        <select
          className="h-10 rounded-md border border-input bg-card px-3 text-sm md:col-span-2"
          value={sort}
          onChange={(event) => setSort(event.target.value as 'latest' | 'view' | 'comment')}
        >
          <option value="latest">최신순</option>
          <option value="view">조회순</option>
          <option value="comment">댓글순</option>
        </select>
        <Input className="md:col-span-2" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <Input className="md:col-span-2" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        <div className="flex items-center justify-end md:col-span-2">
          <Button variant="ghost" onClick={handleResetFilters}>
            필터 초기화
          </Button>
        </div>
      </div>

      {postsQuery.error ? (
        <EmptyState title="게시글을 불러오지 못했습니다." description="잠시 후 다시 시도해주세요." />
      ) : (postsQuery.data?.items.length ?? 0) === 0 ? (
        <EmptyState title="게시글이 없습니다." description="첫 게시글을 등록해보세요." />
      ) : (
        <DataTable
          data={postsQuery.data?.items ?? []}
          columns={columns}
          onRowClick={(post) =>
            navigate(`/posts/${post.id}`, {
              state: {
                fromPath: `${location.pathname}${location.search}`,
              },
            })
          }
        />
      )}

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>
          이전
        </Button>
        <span className="text-sm text-muted-foreground">
          {page} / {Math.max(1, Math.ceil((postsQuery.data?.total ?? 0) / 10))}
        </span>
        <Button
          variant="outline"
          disabled={(postsQuery.data?.total ?? 0) <= page * 10}
          onClick={() => setPage((prev) => prev + 1)}
        >
          다음
        </Button>
      </div>

    </div>
  )
}
