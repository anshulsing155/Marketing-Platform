import React from 'react'
import { DivideIcon as LucideIcon } from 'lucide-react'
import { Card, CardContent } from './Card'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = 'blue' 
}: StatsCardProps) {
  const colorClasses = {
    blue: {
      bg: 'from-blue-50 to-blue-100',
      icon: 'text-blue-600',
      gradient: 'from-blue-600 to-blue-700'
    },
    green: {
      bg: 'from-emerald-50 to-emerald-100',
      icon: 'text-emerald-600',
      gradient: 'from-emerald-600 to-emerald-700'
    },
    purple: {
      bg: 'from-purple-50 to-purple-100',
      icon: 'text-purple-600',
      gradient: 'from-purple-600 to-purple-700'
    },
    orange: {
      bg: 'from-orange-50 to-orange-100',
      icon: 'text-orange-600',
      gradient: 'from-orange-600 to-orange-700'
    },
    red: {
      bg: 'from-red-50 to-red-100',
      icon: 'text-red-600',
      gradient: 'from-red-600 to-red-700'
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend && (
              <div className={`flex items-center text-sm ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <span className="font-medium">
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-gray-500 ml-1">vs last month</span>
              </div>
            )}
          </div>
          <div className={`p-4 rounded-xl bg-gradient-to-r ${colorClasses[color].bg}`}>
            <Icon className={`w-8 h-8 ${colorClasses[color].icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}