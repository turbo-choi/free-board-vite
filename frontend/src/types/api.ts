import type { User } from '@/types/domain'

export interface ApiError {
  message: string
  code: string
}

export interface LoginResponse {
  user: User
  token: string
}
