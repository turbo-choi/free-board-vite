import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toApiError } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

export function SignupPage() {
  const navigate = useNavigate()
  const { signup } = useAuth()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim() || !name.trim() || !password.trim()) {
      toast.error('이메일, 이름, 비밀번호를 입력하세요.')
      return
    }
    if (password.trim().length < 4) {
      toast.error('비밀번호는 최소 4자 이상이어야 합니다.')
      return
    }
    if (password !== passwordConfirm) {
      toast.error('비밀번호 확인이 일치하지 않습니다.')
      return
    }

    try {
      setLoading(true)
      await signup({
        email: email.trim(),
        name: name.trim(),
        password: password.trim(),
      })
      toast.success('회원가입이 완료되었습니다.')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const apiError = toApiError(error)
      toast.error(apiError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <Card className="w-full max-w-md animate-fadeSlideUp">
        <CardHeader>
          <CardTitle>CorpBoard Signup</CardTitle>
          <CardDescription>이메일과 비밀번호로 계정을 생성하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@corp.local"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="홍길동"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="4자 이상 입력"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-confirm">Password Confirm</Label>
              <Input
                id="password-confirm"
                type="password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                placeholder="비밀번호 재입력"
              />
            </div>
            <Button className="w-full" disabled={loading}>
              {loading ? '가입 중...' : '회원가입'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            이미 계정이 있나요?{' '}
            <Link to="/login" className="text-primary hover:underline">
              로그인
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
