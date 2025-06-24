import { useEffect, useState } from 'react'
import { 
  Users, 
  Send, 
  Eye, 
  Mail,
  UserPlus,
  BarChart3,
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

interface CampaignDataPoint {
  name: string
  sent: number
  opened: number
  clicked: number
  bounced: number
}

interface GrowthDataPoint {
  name: string
  subscribers: number
  active: number
}

interface ChannelDataPoint {
  name: string
  value: number
  color: string
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
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [campaignData, setCampaignData] = useState<CampaignDataPoint[]>([])
  const [growthData, setGrowthData] = useState<GrowthDataPoint[]>([])
  const [channelData, setChannelData] = useState<ChannelDataPoint[]>([
    { name: 'Email', value: 0, color: '#3B82F6' },
    { name: 'WhatsApp', value: 0, color: '#10B981' },
    { name: 'SMS', value: 0, color: '#8B5CF6' }
  ])

  useEffect(() => {
    fetchStats()
    fetchRecentActivity()
    fetchCampaignData()
    fetchSubscriberGrowthData()
    fetchChannelDistributionData()
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

      // Calculate open and click rates from campaign analytics
      const analyticsRes = await supabase
        .from('campaign_analytics')
        .select('sent_count, open_count, click_count')
        .eq('status', 'SENT')
      
      let totalSent = 0
      let totalOpened = 0
      let totalClicked = 0
      
      if (analyticsRes.data && analyticsRes.data.length > 0) {
        analyticsRes.data.forEach(campaign => {
          totalSent += campaign.sent_count || 0
          totalOpened += campaign.open_count || 0
          totalClicked += campaign.click_count || 0
        })
      }
      
      const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0
      const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0

      setStats({
        totalSubscribers: subscribersRes.count || 0,
        totalCampaigns: campaignsRes.count || 0,
        totalGroups: groupsRes.count || 0,
        totalTemplates: (emailTemplatesRes.count || 0) + (whatsappTemplatesRes.count || 0),
        activeSubscribers,
        campaignsSent: sentCampaigns,
        openRate: parseFloat(openRate.toFixed(1)),
        clickRate: parseFloat(clickRate.toFixed(1))
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      const activitiesData: RecentActivity[] = []
      
      // Get recent campaigns
      const campaignsRes = await supabase
        .from('campaigns')
        .select('id, name, status, created_at, subscriber_count')
        .order('created_at', { ascending: false })
        .limit(2)
      
      if (campaignsRes.data) {
        campaignsRes.data.forEach(campaign => {
          activitiesData.push({
            id: campaign.id,
            type: 'campaign',
            title: campaign.name,
            description: `Sent to ${campaign.subscriber_count || 0} subscribers`,
            timestamp: new Date(campaign.created_at).toLocaleString(),
            status: campaign.status
          })
        })
      }
      
      // Get recent subscribers
      const subscribersRes = await supabase
        .from('subscribers')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(2)
      
      if (subscribersRes.data) {
        subscribersRes.data.forEach(subscriber => {
          activitiesData.push({
            id: subscriber.id,
            type: 'subscriber',
            title: 'New subscriber joined',
            description: subscriber.email,
            timestamp: new Date(subscriber.created_at).toLocaleString()
          })
        })
      }
      
      // Get recent templates
      const templatesRes = await supabase
        .from('email_templates')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (templatesRes.data) {
        templatesRes.data.forEach(template => {
          activitiesData.push({
            id: template.id,
            type: 'template',
            title: 'Email template created',
            description: template.name,
            timestamp: new Date(template.created_at).toLocaleString()
          })
        })
      }
      
      // Sort by timestamp (most recent first)
      activitiesData.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })
      
      setRecentActivity(activitiesData.slice(0, 3))
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    }
  }

  const fetchCampaignData = async () => {
    try {
      // Get campaign data for the last 6 months
      const now = new Date()
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      
      // Format date to ISO string for Supabase query
      const fromDate = sixMonthsAgo.toISOString()
      
      const campaignAnalyticsRes = await supabase
        .from('campaign_analytics')
        .select('campaign_id, sent_date, sent_count, open_count, click_count, bounce_count')
        .gte('sent_date', fromDate)
        .order('sent_date', { ascending: true })
      
      if (campaignAnalyticsRes.data) {
        // Group by month
        const monthlyData: Record<string, { sent: number, opened: number, clicked: number, bounced: number }> = {}
        
        campaignAnalyticsRes.data.forEach(campaign => {
          if (!campaign.sent_date) return
          
          const date = new Date(campaign.sent_date)
          const monthKey = date.toLocaleString('en', { month: 'short' })
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { sent: 0, opened: 0, clicked: 0, bounced: 0 }
          }
          
          monthlyData[monthKey].sent += campaign.sent_count || 0
          monthlyData[monthKey].opened += campaign.open_count || 0
          monthlyData[monthKey].clicked += campaign.click_count || 0
          monthlyData[monthKey].bounced += campaign.bounce_count || 0
        })
        
        // Convert to array for chart
        const chartData = Object.keys(monthlyData).map(month => ({
          name: month,
          sent: monthlyData[month].sent,
          opened: monthlyData[month].opened,
          clicked: monthlyData[month].clicked,
          bounced: monthlyData[month].bounced
        }))
        
        setCampaignData(chartData)
      }
    } catch (error) {
      console.error('Error fetching campaign data:', error)
      // Fallback to empty array if error occurs
      setCampaignData([])
    }
  }

  const fetchSubscriberGrowthData = async () => {
    try {
      // Get subscriber growth data for the last 6 weeks
      const now = new Date()
      const sixWeeksAgo = new Date(now.getTime() - 6 * 7 * 24 * 60 * 60 * 1000)
      
      // Format date to ISO string for Supabase query
      const fromDate = sixWeeksAgo.toISOString()
      
      const subscribersRes = await supabase
        .from('subscribers')
        .select('id, created_at, status')
        .gte('created_at', fromDate)
        .order('created_at', { ascending: true })
      
      if (subscribersRes.data) {
        // Group by week
        const weeklyData: Record<string, { subscribers: number, active: number }> = {}
        
        // Initialize weekly data for the last 6 weeks
        for (let i = 0; i < 6; i++) {
          // Calculate week start for labeling
          new Date(now.getTime() - (6 - i) * 7 * 24 * 60 * 60 * 1000)
          const weekKey = `Week ${i + 1}`
          weeklyData[weekKey] = { subscribers: 0, active: 0 }
        }
        
        // Get a snapshot of total subscribers at the start of the period
        const initialCountRes = await supabase
          .from('subscribers')
          .select('count')
          .lt('created_at', fromDate)
        
        let runningTotal = initialCountRes.count || 0
        let runningActive = 0
        
        // Group subscribers by week
        subscribersRes.data.forEach(subscriber => {
          const subDate = new Date(subscriber.created_at)
          const weeksSince = Math.floor((now.getTime() - subDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
          
          if (weeksSince < 6) {
            const weekKey = `Week ${6 - weeksSince}`
            runningTotal++
            
            if (subscriber.status === 'active') {
              runningActive++
            }
            
            weeklyData[weekKey].subscribers = runningTotal
            weeklyData[weekKey].active = runningActive
          }
        })
        
        // Convert to array for chart
        const chartData = Object.keys(weeklyData).map(week => ({
          name: week,
          subscribers: weeklyData[week].subscribers,
          active: weeklyData[week].active
        }))
        
        setGrowthData(chartData)
      }
    } catch (error) {
      console.error('Error fetching growth data:', error)
      // Fallback to empty array if error occurs
      setGrowthData([])
    }
  }

  const fetchChannelDistributionData = async () => {
    try {
      // Get campaign counts by channel
      const [emailCampaignsRes, whatsappCampaignsRes, smsCampaignsRes] = await Promise.all([
        supabase.from('campaigns').select('id', { count: 'exact' }).eq('channel', 'email'),
        supabase.from('campaigns').select('id', { count: 'exact' }).eq('channel', 'whatsapp'),
        supabase.from('campaigns').select('id', { count: 'exact' }).eq('channel', 'sms')
      ])
      
      const emailCount = emailCampaignsRes.count || 0
      const whatsappCount = whatsappCampaignsRes.count || 0
      const smsCount = smsCampaignsRes.count || 0
      const total = emailCount + whatsappCount + smsCount
      
      if (total > 0) {
        setChannelData([
          { name: 'Email', value: Math.round((emailCount / total) * 100), color: '#3B82F6' },
          { name: 'WhatsApp', value: Math.round((whatsappCount / total) * 100), color: '#10B981' },
          { name: 'SMS', value: Math.round((smsCount / total) * 100), color: '#8B5CF6' }
        ])
      } else {
        // Default values if no campaigns
        setChannelData([
          { name: 'Email', value: 0, color: '#3B82F6' },
          { name: 'WhatsApp', value: 0, color: '#10B981' },
          { name: 'SMS', value: 0, color: '#8B5CF6' }
        ])
      }
    } catch (error) {
      console.error('Error fetching channel distribution:', error)
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
                {campaignData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-gray-500">No campaign data available</p>
                  </div>
                ) : (
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
                )}
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
              {channelData.every(item => item.value === 0) ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-gray-500">No channel data available</p>
                </div>
              ) : (
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
              )}
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
                {growthData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-gray-500">No subscriber data available</p>
                  </div>
                ) : (
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
                )}
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
              {recentActivity.length === 0 ? (
                <div className="py-8 flex items-center justify-center">
                  <p className="text-gray-500">No recent activity</p>
                </div>
              ) : (
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
              )}
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