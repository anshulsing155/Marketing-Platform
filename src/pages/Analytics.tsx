import React, { useState, useEffect } from 'react'
import { TrendingUp, Users, Mail, Eye, MousePointer, Calendar, Download } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatsCard } from '../components/ui/Stats'
import { Header } from '../components/layout/Header'
import { Select } from '../components/ui/Select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'

export function Analytics() {
  const [timeRange, setTimeRange] = useState('30d')
  const [loading, setLoading] = useState(false)

  // Mock analytics data
  const performanceData = [
    { date: '2024-01-01', sent: 1200, delivered: 1180, opened: 850, clicked: 255, bounced: 20 },
    { date: '2024-01-02', sent: 1350, delivered: 1320, opened: 920, clicked: 276, bounced: 30 },
    { date: '2024-01-03', sent: 1100, delivered: 1080, opened: 750, clicked: 225, bounced: 20 },
    { date: '2024-01-04', sent: 1450, delivered: 1420, opened: 1000, clicked: 300, bounced: 30 },
    { date: '2024-01-05', sent: 1600, delivered: 1570, opened: 1100, clicked: 330, bounced: 30 },
    { date: '2024-01-06', sent: 1300, delivered: 1280, opened: 900, clicked: 270, bounced: 20 },
    { date: '2024-01-07', sent: 1750, delivered: 1720, opened: 1200, clicked: 360, bounced: 30 },
  ]

  const deviceData = [
    { name: 'Desktop', value: 45, color: '#3B82F6' },
    { name: 'Mobile', value: 40, color: '#10B981' },
    { name: 'Tablet', value: 15, color: '#8B5CF6' }
  ]

  const campaignPerformance = [
    { name: 'Welcome Series', sent: 2500, opened: 1800, clicked: 540, rate: 72 },
    { name: 'Newsletter', sent: 3200, opened: 2100, clicked: 630, rate: 65.6 },
    { name: 'Product Launch', sent: 1800, opened: 1350, clicked: 405, rate: 75 },
    { name: 'Promotional', sent: 2800, opened: 1960, clicked: 588, rate: 70 },
    { name: 'Re-engagement', sent: 1500, opened: 900, clicked: 180, rate: 60 }
  ]

  const engagementTrend = [
    { month: 'Jan', openRate: 68, clickRate: 18, unsubscribeRate: 2.1 },
    { month: 'Feb', openRate: 72, clickRate: 19, unsubscribeRate: 1.8 },
    { month: 'Mar', openRate: 70, clickRate: 17, unsubscribeRate: 2.3 },
    { month: 'Apr', openRate: 75, clickRate: 21, unsubscribeRate: 1.9 },
    { month: 'May', openRate: 73, clickRate: 20, unsubscribeRate: 2.0 },
    { month: 'Jun', openRate: 76, clickRate: 22, unsubscribeRate: 1.7 }
  ]

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ]

  const exportReport = () => {
    // Mock export functionality
    toast.success('Analytics report exported successfully!')
  }

  const headerActions = (
    <div className="flex items-center space-x-3">
      <Select
        options={timeRangeOptions}
        value={timeRange}
        onChange={(e) => setTimeRange(e.target.value)}
      />
      <Button variant="outline" icon={Download} onClick={exportReport}>
        Export Report
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Analytics"
        subtitle="Track your campaign performance and subscriber engagement"
        actions={headerActions}
      />

      <div className="p-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Sent"
            value="12,450"
            icon={Mail}
            color="blue"
            trend={{ value: 15.3, isPositive: true }}
          />
          <StatsCard
            title="Open Rate"
            value="72.5%"
            icon={Eye}
            color="green"
            trend={{ value: 3.2, isPositive: true }}
          />
          <StatsCard
            title="Click Rate"
            value="18.3%"
            icon={MousePointer}
            color="purple"
            trend={{ value: -1.1, isPositive: false }}
          />
          <StatsCard
            title="Bounce Rate"
            value="2.1%"
            icon={TrendingUp}
            color="orange"
            trend={{ value: -0.5, isPositive: true }}
          />
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Email Performance Overview</h3>
                <p className="text-sm text-gray-600">Daily email campaign metrics</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorClicked" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Area type="monotone" dataKey="sent" stackId="1" stroke="#3B82F6" fill="url(#colorSent)" />
                    <Area type="monotone" dataKey="opened" stackId="2" stroke="#10B981" fill="url(#colorOpened)" />
                    <Area type="monotone" dataKey="clicked" stackId="3" stroke="#8B5CF6" fill="url(#colorClicked)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Device Breakdown</h3>
              <p className="text-sm text-gray-600">Email opens by device type</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {deviceData.map((item, index) => (
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

        {/* Campaign Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Top Performing Campaigns</h3>
              <p className="text-sm text-gray-600">Campaigns ranked by open rate</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaignPerformance.map((campaign, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span>{campaign.sent.toLocaleString()} sent</span>
                        <span>{campaign.opened.toLocaleString()} opened</span>
                        <span>{campaign.clicked.toLocaleString()} clicked</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">{campaign.rate}%</div>
                      <div className="text-sm text-gray-500">open rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Engagement Trends</h3>
              <p className="text-sm text-gray-600">Monthly engagement metrics</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6b7280" />
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
                    dataKey="openRate" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    name="Open Rate (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clickRate" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    name="Click Rate (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="unsubscribeRate" 
                    stroke="#EF4444" 
                    strokeWidth={3}
                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                    name="Unsubscribe Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Insights and Recommendations */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Insights & Recommendations</h3>
            <p className="text-sm text-gray-600">AI-powered suggestions to improve your campaigns</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
                  <h4 className="font-medium text-blue-900">Peak Engagement Time</h4>
                </div>
                <p className="text-sm text-blue-800">
                  Your emails perform best when sent on Tuesday at 10 AM. Consider scheduling future campaigns at this time.
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center mb-2">
                  <Eye className="w-5 h-5 text-green-600 mr-2" />
                  <h4 className="font-medium text-green-900">Subject Line Optimization</h4>
                </div>
                <p className="text-sm text-green-800">
                  Subject lines with 6-10 words have 21% higher open rates. Keep your next subject line concise.
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center mb-2">
                  <Users className="w-5 h-5 text-purple-600 mr-2" />
                  <h4 className="font-medium text-purple-900">Segment Performance</h4>
                </div>
                <p className="text-sm text-purple-800">
                  Your "New Subscribers" segment has 15% higher engagement. Consider creating more targeted content.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}