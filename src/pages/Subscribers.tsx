import React, { useState, useEffect } from 'react'
import { Plus, Search, Upload, Download, Trash2, Edit2, Phone, Mail, Filter, MoreHorizontal, Users } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Header } from '../components/layout/Header'
import { subscriberAPI, Subscriber } from '../lib/api'
import toast from 'react-hot-toast'

export function Subscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([])
  const [newSubscriber, setNewSubscriber] = useState({
    email: '',
    phone: '',
    first_name: '',
    last_name: '',
    whatsapp_opt_in: false
  })

  useEffect(() => {
    fetchSubscribers()
  }, [])

  const fetchSubscribers = async () => {
    try {
      const data = await subscriberAPI.getAll()
      setSubscribers(data)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const addSubscriber = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await subscriberAPI.create({
        email: newSubscriber.email,
        phone: newSubscriber.phone || undefined,
        first_name: newSubscriber.first_name || undefined,
        last_name: newSubscriber.last_name || undefined,
        whatsapp_opt_in: newSubscriber.whatsapp_opt_in,
        status: 'ACTIVE'
      })
      
      toast.success('Subscriber added successfully!')
      setShowAddModal(false)
      setNewSubscriber({ 
        email: '', 
        phone: '', 
        first_name: '', 
        last_name: '', 
        whatsapp_opt_in: false 
      })
      fetchSubscribers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const deleteSubscriber = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscriber?')) return

    try {
      await subscriberAPI.delete(id)
      toast.success('Subscriber deleted successfully!')
      fetchSubscribers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const bulkDelete = async () => {
    if (selectedSubscribers.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedSubscribers.length} subscribers?`)) return

    try {
      // Delete subscribers one by one since we don't have a bulk delete endpoint
      for (const id of selectedSubscribers) {
        await subscriberAPI.delete(id)
      }
      toast.success(`${selectedSubscribers.length} subscribers deleted successfully!`)
      setSelectedSubscribers([])
      fetchSubscribers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const exportSubscribers = () => {
    const csvContent = [
      ['Email', 'Phone', 'First Name', 'Last Name', 'Status', 'WhatsApp Opt-in', 'Created At'],
      ...filteredSubscribers.map(sub => [
        sub.email,
        sub.phone || '',
        sub.first_name || '',
        sub.last_name || '',
        sub.status,
        sub.whatsapp_opt_in ? 'Yes' : 'No',
        new Date(sub.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subscribers.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredSubscribers = subscribers.filter(subscriber => {
    const matchesSearch = 
      subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscriber.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscriber.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscriber.phone?.includes(searchTerm)
    
    const matchesStatus = statusFilter === 'all' || subscriber.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusVariant = (status: SubscriberStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success'
      case 'UNSUBSCRIBED':
        return 'default'
      case 'BOUNCED':
        return 'error'
      default:
        return 'default'
    }
  }

  const toggleSelectAll = () => {
    if (selectedSubscribers.length === filteredSubscribers.length) {
      setSelectedSubscribers([])
    } else {
      setSelectedSubscribers(filteredSubscribers.map(sub => sub.id))
    }
  }

  const toggleSelectSubscriber = (id: string) => {
    setSelectedSubscribers(prev => 
      prev.includes(id) 
        ? prev.filter(subId => subId !== id)
        : [...prev, id]
    )
  }

  const headerActions = (
    <div className="flex items-center space-x-3">
      {selectedSubscribers.length > 0 && (
        <Button variant="danger" size="sm" onClick={bulkDelete}>
          Delete Selected ({selectedSubscribers.length})
        </Button>
      )}
      <Button variant="outline" icon={Upload} size="sm">
        Import
      </Button>
      <Button variant="outline" icon={Download} size="sm" onClick={exportSubscribers}>
        Export
      </Button>
      <Button icon={Plus} onClick={() => setShowAddModal(true)}>
        Add Subscriber
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Subscribers"
        subtitle="Manage your email and WhatsApp subscribers"
        actions={headerActions}
      />

      <div className="p-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search subscribers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="UNSUBSCRIBED">Unsubscribed</option>
                  <option value="BOUNCED">Bounced</option>
                </select>
                <Button variant="outline" icon={Filter} size="sm">
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscribers Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  All Subscribers ({filteredSubscribers.length})
                </h3>
                {selectedSubscribers.length > 0 && (
                  <p className="text-sm text-gray-600">
                    {selectedSubscribers.length} selected
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <LoadingSpinner size="lg" className="mx-auto mb-4" />
                <p className="text-gray-600">Loading subscribers...</p>
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={Users}
                  title="No subscribers found"
                  description={searchTerm || statusFilter !== 'all' 
                    ? "No subscribers match your current filters. Try adjusting your search or filters."
                    : "Start building your audience by adding your first subscriber."
                  }
                  action={!searchTerm && statusFilter === 'all' ? {
                    label: "Add Your First Subscriber",
                    onClick: () => setShowAddModal(true)
                  } : undefined}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedSubscribers.length === filteredSubscribers.length}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        WhatsApp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Added
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSubscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedSubscribers.includes(subscriber.id)}
                            onChange={() => toggleSelectSubscriber(subscriber.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm font-medium text-gray-900">
                              <Mail className="w-4 h-4 mr-2 text-blue-600" />
                              {subscriber.email}
                            </div>
                            {subscriber.phone && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="w-4 h-4 mr-2 text-green-600" />
                                {subscriber.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {subscriber.first_name || subscriber.last_name
                              ? `${subscriber.first_name || ''} ${subscriber.last_name || ''}`.trim()
                              : '—'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStatusVariant(subscriber.status)}>
                            {subscriber.status.toLowerCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={subscriber.whatsapp_opt_in ? 'success' : 'default'}>
                            {subscriber.whatsapp_opt_in ? 'Opted In' : 'Not Opted'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(subscriber.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end items-center space-x-2">
                            <Button variant="ghost" size="sm" icon={Edit2} />
                            <Button variant="ghost" size="sm" icon={MoreHorizontal} />
                            <Button 
                              variant="ghost" 
                              size="sm"
                              icon={Trash2}
                              onClick={() => deleteSubscriber(subscriber.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Subscriber Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Subscriber"
        >
          <div className="p-6">
            <form onSubmit={addSubscriber} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={newSubscriber.email}
                onChange={(e) => setNewSubscriber({
                  ...newSubscriber,
                  email: e.target.value
                })}
                required
              />
              <Input
                label="Phone Number"
                type="tel"
                value={newSubscriber.phone}
                onChange={(e) => setNewSubscriber({
                  ...newSubscriber,
                  phone: e.target.value
                })}
                placeholder="e.g., +1234567890"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={newSubscriber.first_name}
                  onChange={(e) => setNewSubscriber({
                    ...newSubscriber,
                    first_name: e.target.value
                  })}
                />
                <Input
                  label="Last Name"
                  value={newSubscriber.last_name}
                  onChange={(e) => setNewSubscriber({
                    ...newSubscriber,
                    last_name: e.target.value
                  })}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="whatsapp_opt_in"
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  checked={newSubscriber.whatsapp_opt_in}
                  onChange={(e) => setNewSubscriber({
                    ...newSubscriber,
                    whatsapp_opt_in: e.target.checked
                  })}
                />
                <label htmlFor="whatsapp_opt_in" className="ml-2 text-sm text-gray-700">
                  Opt-in for WhatsApp marketing messages
                </label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Add Subscriber
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </div>
  )
}