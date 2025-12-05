import { useState, useCallback } from 'react'

interface UsePaginationProps {
  initialPage?: number
  initialLimit?: number
}

interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function usePagination({ initialPage = 1, initialLimit = 20 }: UsePaginationProps = {}) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0
  })

  const updatePagination = useCallback((data: Partial<PaginationState>) => {
    setPagination(prev => ({
      ...prev,
      ...data
    }))
  }, [])

  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({
      ...prev,
      page: Math.max(1, Math.min(page, prev.totalPages || 1))
    }))
  }, [])

  const nextPage = useCallback(() => {
    setPagination(prev => {
      const next = prev.page + 1
      if (next <= (prev.totalPages || 1)) {
        return { ...prev, page: next }
      }
      return prev
    })
  }, [])

  const prevPage = useCallback(() => {
    setPagination(prev => ({
      ...prev,
      page: Math.max(1, prev.page - 1)
    }))
  }, [])

  const reset = useCallback(() => {
    setPagination({
      page: initialPage,
      limit: initialLimit,
      total: 0,
      totalPages: 0
    })
  }, [initialPage, initialLimit])

  return {
    ...pagination,
    updatePagination,
    goToPage,
    nextPage,
    prevPage,
    reset,
    skip: (pagination.page - 1) * pagination.limit
  }
}

