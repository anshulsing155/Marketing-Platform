import React, { useEffect, useState } from 'react'
import { 
  Users, 
  Send, 
  Eye, 
  TrendingUp,
  Mail,
  UserPlus,
  BarChart3,
  Calendar,
  MessageCircle,
  Target,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatsCard } from '../components/ui/Stats'
import { Header } from '../components/layout/Header'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

interface Stats {
  totalSubscribers: number
  totalCampaigns: number
  totalGroups: number
  totalTemplates: number
  activeSubscribers: number
  campaignsSent: number
  openRate: number
  clickRate: number
}

interface RecentActivity {
  id: string
  type: 'campaign' | 'subscriber' | 'template'
  title: string
  description: string
  timestamp: string
  status?: string
}

export function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalSubscribers: 0,
    totalCampaigns: 0,
    totalGroups: 0,
    totalTemplates: 0,
    activeSubscribers: 0,
    campaignsSent: 0,
    openRate: 0,
    clickRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'campaign',
      title: 'Welcome Series Campaign',
      description: 'Sent to 1,234 subscribers',
      timestamp: '2 hours ago',
      status: 'sent'
    },
    {
      id: '2',
      type: 'subscriber',
      title: 'New subscriber joined',
      description: 'john.doe@example.com subscribed',
      timestamp: '4 hours ago'
    },
    {
      id: '3',
      type: 'template',
      title: 'Newsletter template created',
      description: 'Monthly Newsletter v2.0',
      timestamp: '1 day ago'
    }
  ])

  // Enhanced mock data for charts
  const campaignData = [
    { name: 'Jan', sent: 1200, opened: 840, clicked: 252, bounced: 24 },
    { name: 'Feb', sent: 1800, opened: 1260, clicked: 378, bounced: 36 },
    { name: 'Mar', sent: 2500, opened: 1750, clicked: 525, bounced: 50 },
    { name: 'Apr', sent: 3000, opened: 2100, clicked: 630, bounced: 60 },
    { name: 'May', sent: 2800, opened: 1960, clicked: 588, bounced: 56 },
    { name: 'Jun', sent: 3200, opened: 2240, clicked: 672, bounced: 64 },
  ]

  const growthData = [
    { name: 'Week 1', subscribers: 1500, active: 1350 },
    { name: 'Week 2', subscribers: 1800, active: 1620 },
    { name: 'Week 3', subscribers: 2200, active: 1980 },
    { name: 'Week 4', subscribers: 2800, active: 2520 },
    { name: 'Week 5', subscribers: 3200, active: 2880 },
    { name: 'Week 6', subscribers: 3800, active: 3420 },
  ]

  const channelData = [
    { name: 'Email', value: 65, color: '#3B82F6' },
    { name: 'WhatsApp', value: 25, color: '#10B981' },
    { name: 'SMS', value: 10, color: '#8B5CF6' }
  ]

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [subscribersRes, campaignsRes, groupsRes, emailTemplatesRes, whatsappTemplatesRes] = await Promise.all([
        supabase.from('subscribers').select('id, status', { count: 'exact' }),
        supabase.from('campaigns').select('id, status', { count: 'exact' }),
        supabase.from('user_groups').select('id', { count: 'exact' }),
        supabase.from('email_templates').select('id', { count: 'exact' }),
        supabase.from('whatsapp_templates').select('id', { count: 'exact' })
      ])

      const activeSubscribers = subscribersRes.data?.filter(s => s.status === 'active').length || 0
      const sentCampaigns = campaignsRes.data?.filter(c => c.status === 'SENT').length || 0

      setStats({
        totalSubscribers: subscribersRes.count || 0,
        totalCampaigns: campaignsRes.count || 0,
        totalGroups: groupsRes.count || 0,
        totalTemplates: (emailTemplatesRes.count || 0) + (whatsappTemplatesRes.count || 0),
        activeSubscribers,
        campaignsSent: sentCampaigns,
        openRate: 72.5, // Mock data - would come from analytics
        clickRate: 18.3  // Mock data - would come from analytics
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'campaign':
        return Send
      case 'subscriber':
        return UserPlus
      case 'template':
        return BarChart3
      default:
        return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'campaign':
        return 'text-blue-600 bg-blue-100'
      case 'subscriber':
        return 'text-green-600 bg-green-100'
      case 'template':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title={`Welcome back, ${profile?.full_name?.split(' ')[0] || 'User'}!`}
        subtitle="Here's what's happening with your marketing campaigns today."
      />

      <div className="p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Subscribers"
            value={loading ? '—' : stats.totalSubscribers}
            icon={Users}
            color="blue"
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatsCard
            title="Campaigns Sent"
            value={loading ? '—' : stats.campaignsSent}
            icon={Send}
            color="green"
            trend={{ value: 8.2, isPositive: true }}
          />
          <StatsCard
            title="Open Rate"
            value={loading ? '—' : `${stats.openRate}%`}
            icon={Eye}
            color="purple"
            trend={{ value: 3.1, isPositive: true }}
          />
          <StatsCard
            title="Click Rate"
            value={loading ? '—' : `${stats.clickRate}%`}
            icon={Target}
            color="orange"
            trend={{ value: -1.2, isPositive: false }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Campaign Performance Chart */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Campaign Performance</h3>
                    <p className="text-sm text-gray-600">Monthly email campaign metrics</p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">Sent</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">Opened</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">Clicked</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={campaignData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="sent" fill="#3B82F6" name="Sent" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="opened" fill="#10B981" name="Opened" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="clicked" fill="#8B5CF6" name="Clicked" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Channel Distribution */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Channel Distribution</h3>
              <p className="text-sm text-gray-600">Campaign channels breakdown</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {channelData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Subscriber Growth */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Subscriber Growth</h3>
                <p className="text-sm text-gray-600">Weekly subscriber acquisition and engagement</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="subscribers" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                      name="Total Subscribers"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="active" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                      name="Active Subscribers"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <p className="text-sm text-gray-600">Latest updates and actions</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const Icon = getActivityIcon(activity.type)
                  return (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <p className="text-sm text-gray-600">Common tasks to get you started</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/subscribers">
                <Button variant="outline" className="w-full h-24 flex-col hover:shadow-md transition-all duration-200">
                  <UserPlus className="w-6 h-6 mb-2 text-blue-600" />
                  <span className="font-medium">Add Subscribers</span>
                  <span className="text-xs text-gray-500">Import or add manually</span>
                </Button>
              </Link>
              <Link to="/templates">
                <Button variant="outline" className="w-full h-24 flex-col hover:shadow-md transition-all duration-200">
                  <Mail className="w-6 h-6 mb-2 text-green-600" />
                  <span className="font-medium">Create Template</span>
                  <span className="text-xs text-gray-500">Email or WhatsApp</span>
                </Button>
              </Link>
              <Link to="/campaigns">
                <Button variant="outline" className="w-full h-24 flex-col hover:shadow-md transition-all duration-200">
                  <Send className="w-6 h-6 mb-2 text-purple-600" />
                  <span className="font-medium">New Campaign</span>
                  <span className="text-xs text-gray-500">Send to your audience</span>
                </Button>
              </Link>
              <Link to="/groups">
                <Button variant="outline" className="w-full h-24 flex-col hover:shadow-md transition-all duration-200">
                  <Users className="w-6 h-6 mb-2 text-orange-600" />
                  <span className="font-medium">Manage Groups</span>
                  <span className="text-xs text-gray-500">Organize subscribers</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}