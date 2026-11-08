'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import {
  Bell,
  BellOff,
  CheckCheck,
  Info,
  AlertCircle,
  Megaphone,
  Zap,
  CreditCard,
  MessageSquare,
} from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { usersApi } from '@/lib/api'
import { formatRelativeTime, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Notification } from '@/types'

const NOTIF_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  INFO: Info,
  WARNING: AlertCircle,
  ANNOUNCEMENT: Megaphone,
  CREDIT: Zap,
  BILLING: CreditCard,
  TICKET: MessageSquare,
  SYSTEM: Bell,
}

export default function NotificationsPage() {
  const { data, isLoading, mutate } = useSWR(
    'notifications',
    () => usersApi.getNotifications(),
  )

  const [markingAll, setMarkingAll] = useState(false)

  const handleMarkRead = async (id: string) => {
    try {
      await usersApi.markNotificationRead(id)
      await mutate()
    } catch {
      toast.error('Erreur')
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await usersApi.markAllNotificationsRead()
      await mutate()
      toast.success('Toutes les notifications marquées comme lues')
    } catch {
      toast.error('Erreur')
    } finally {
      setMarkingAll(false)
    }
  }

  const notifications: Notification[] = data?.data ?? []
  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="Notifications"
        description="Messages système et alertes importantes"
      />

      <div className="flex-1 p-6 space-y-4">
        {/* Header actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </h2>
            {unreadCount > 0 && (
              <Badge variant="default">{unreadCount} non lue{unreadCount !== 1 ? 's' : ''}</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAllRead}
              isLoading={markingAll}
            >
              <CheckCheck className="w-4 h-4" />
              Tout marquer lu
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : !notifications.length ? (
          <Card>
            <div className="p-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center mb-4">
                <BellOff className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Aucune notification</h3>
              <p className="text-xs text-gray-500">
                Vous êtes à jour !
              </p>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="divide-y divide-gray-800">
              {notifications.map((notif) => {
                const Icon = NOTIF_ICONS[notif.type] ?? Bell
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      'flex items-start gap-4 px-5 py-4 transition-colors',
                      !notif.isRead && 'bg-gray-900/40',
                    )}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                      !notif.isRead ? 'bg-white' : 'bg-gray-800',
                    )}>
                      <Icon className={cn('w-4 h-4', !notif.isRead ? 'text-black' : 'text-gray-400')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={cn(
                          'text-sm font-medium',
                          !notif.isRead ? 'text-white' : 'text-gray-300',
                        )}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{notif.message}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {formatRelativeTime(notif.createdAt)}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="text-xs text-gray-500 hover:text-white transition-colors flex-shrink-0 mt-0.5"
                      >
                        Lu
                      </button>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
