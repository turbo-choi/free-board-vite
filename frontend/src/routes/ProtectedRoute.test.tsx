import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/routes/ProtectedRoute'

const mockUseAuth = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

function renderProtectedRoute(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <Routes>
        <Route path="/login" element={<div data-testid="login-screen">login</div>} />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <div data-testid="protected-screen">protected</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  afterEach(() => {
    mockUseAuth.mockReset()
  })

  it('shows a loading message while authentication is being resolved', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    })

    renderProtectedRoute('/dashboard')

    expect(screen.getByText('인증 상태 확인 중...')).toBeInTheDocument()
  })

  it('redirects unauthenticated users to login', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    })

    renderProtectedRoute('/dashboard')

    expect(screen.getByTestId('login-screen')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-screen')).not.toBeInTheDocument()
  })

  it('renders protected content for authenticated users', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    })

    renderProtectedRoute('/dashboard')

    expect(screen.getByTestId('protected-screen')).toBeInTheDocument()
  })
})
