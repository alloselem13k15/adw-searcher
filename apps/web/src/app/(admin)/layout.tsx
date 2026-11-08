'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { useAuth } from '@/hooks/useAuth'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isLoading, initialize, isInitialized } = useAuth()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (isInitialized && !user) {
      router.replace('/login')
    }
    if (isInitialized && user && user.role !== 'ADMIN' && user.role !== 'OWNER') {
      router.replace('/dashboard')
    }
  }, [isInitialized, user, router])

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) return null

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar section="admin" />
      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  )
}
