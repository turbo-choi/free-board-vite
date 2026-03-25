import type { NavigationMenuGroup } from '@/types/domain'

export interface HeaderSearchContext {
  targetPath: string
  query: string
  placeholder: string
}

function splitPathAndSearch(pathWithSearch: string) {
  const questionIndex = pathWithSearch.indexOf('?')
  if (questionIndex < 0) {
    return {
      pathname: pathWithSearch,
      search: '',
    }
  }

  return {
    pathname: pathWithSearch.slice(0, questionIndex),
    search: pathWithSearch.slice(questionIndex),
  }
}

function findMenuMatch(groups: NavigationMenuGroup[], target: string) {
  for (const group of groups) {
    const item = group.items.find((entry) => entry.target === target)
    if (item) {
      return { group, item }
    }
  }

  return null
}

function resolveBoardLabel(groups: NavigationMenuGroup[], boardSlug: string | null) {
  if (!boardSlug) return null
  const matched = findMenuMatch(groups, `/boards/${boardSlug}`)
  return matched?.item.label ?? boardSlug
}

function getMenuTitle(groups: NavigationMenuGroup[], target: string) {
  const matched = findMenuMatch(groups, target)
  if (!matched) return null

  if (matched.group.category_id === null) {
    return matched.item.label
  }

  return `${matched.group.category_label} > ${matched.item.label}`
}

export function getHeaderTitle({
  pathname,
  search,
  groups,
  postDetailFromPath,
}: {
  pathname: string
  search: string
  groups: NavigationMenuGroup[]
  postDetailFromPath?: string | null
}) {
  if (postDetailFromPath) {
    const source = splitPathAndSearch(postDetailFromPath)
    const inheritedTitle = getMenuTitle(groups, source.pathname)
    if (inheritedTitle) {
      return inheritedTitle
    }
  }

  const directTitle = getMenuTitle(groups, pathname)
  if (directTitle) {
    return directTitle
  }

  const segments = pathname.split('/').filter(Boolean)
  const [first, second] = segments

  if (!first || first === 'dashboard') return '대시보드'
  if (first === 'boards') return `게시판 > ${resolveBoardLabel(groups, second) ?? ''}`
  if (first === 'posts') return '게시글 상세'
  if (first === 'stats') return '통계'

  if (first === 'write') {
    const params = new URLSearchParams(search)
    const boardLabel = resolveBoardLabel(groups, params.get('board'))
    const postId = params.get('postId')
    if (postId && boardLabel) return `게시판 > ${boardLabel} > 수정`
    if (postId) return '게시글 수정'
    if (boardLabel) return `게시판 > ${boardLabel} > 글쓰기`
    return '게시글 작성'
  }

  if (first === 'admin') {
    return '관리자'
  }

  return segments.join(' > ')
}

export function buildHeaderSearchContext({
  pathname,
  search,
  groups,
  postDetailFromPath,
}: {
  pathname: string
  search: string
  groups: NavigationMenuGroup[]
  postDetailFromPath?: string | null
}): HeaderSearchContext | null {
  const source =
    pathname.startsWith('/posts/') && postDetailFromPath
      ? splitPathAndSearch(postDetailFromPath)
      : { pathname, search }

  if (source.pathname.startsWith('/boards/')) {
    const boardSlug = source.pathname.split('/').filter(Boolean)[1] ?? null
    const boardLabel = resolveBoardLabel(groups, boardSlug)
    const params = new URLSearchParams(source.search)

    return {
      targetPath: source.pathname,
      query: params.get('q') ?? '',
      placeholder: boardLabel ? `${boardLabel} 게시글 검색` : '게시글 검색',
    }
  }

  if (source.pathname === '/write') {
    const params = new URLSearchParams(source.search)
    const boardSlug = params.get('board')
    if (!boardSlug) return null

    return {
      targetPath: `/boards/${boardSlug}`,
      query: '',
      placeholder: `${resolveBoardLabel(groups, boardSlug) ?? boardSlug} 게시글 검색`,
    }
  }

  return null
}
