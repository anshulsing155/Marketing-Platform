import React, { useState, useEffect } from 'react'
import { Plus, Users, Trash2, Edit2, UserPlus, UserMinus } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { groupAPI, UserGroup, subscriberAPI, Subscriber } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Checkbox } from '../components/ui/Checkbox'
import { Modal } from '../components/ui/Modal'

interface GroupWithCount extends UserGroup {
  _count?: {
    subscribers: number
  }
}

export function Groups() {
  const { user, profile, loading: authLoading } = useAuth()
  const [groups, setGroups] = useState<GroupWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSubscribersModal, setShowSubscribersModal] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [groupSubscribers, setGroupSubscribers] = useState<Subscriber[]>([])
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([])
  const [loadingSubscribers, setLoadingSubscribers] = useState(false)
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    if (user && profile) {
      fetchGroups()
    } else if (!authLoading && !profile) {
      setLoading(false) // No need to keep showing loading if auth is done but no profile
    }
  }, [user, profile, authLoading])

  const fetchGroups = async () => {
    if (!user || !profile) return
    
    try {
      console.log('Fetching groups for user:', user.id, 'and profile:', profile.id)
      const data = await groupAPI.getAll() as GroupWithCount[]
      
      // Handle potential differences in response format
      const processedData = data.map(group => ({
        ...group,
        // Ensure created_at is a Date if it's a string
        created_at: typeof group.created_at === 'string' ? new Date(group.created_at) : group.created_at,
        // Ensure _count exists with subscribers
        _count: group._count || { subscribers: 0 }
      }))
      
      setGroups(processedData)
    } catch (error: any) {
      console.error('Error fetching groups:', error)
      toast.error('Failed to load groups: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const addGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('You must be logged in to create a group')
      return
    }
    
    if (!profile) {
      toast.error('Your user profile is not loaded. Please refresh and try again.')
      return
    }

    try {
      // Using the profile ID as a string for consistency
      console.log('Creating group for profile:', profile)
      
      const response = await groupAPI.create({
        name: newGroup.name,
        description: newGroup.description || undefined,
        created_by: profile.id
      })
      
      // Add a delay to ensure the database has time to process the new record
      console.log('Group created successfully:', response)
      toast.success('Group created successfully!')
      setShowAddModal(false)
      setNewGroup({ name: '', description: '' })
      
      // Add a small delay before fetching updated groups
      setTimeout(() => {
        fetchGroups()
      }, 500)
    } catch (error: any) {
      console.error('Error creating group:', error)
      
      // Debug information
      console.log('Profile used for group creation:', {
        id: profile.id,
        email: profile.email,
        type: typeof profile.id
      })
      
      // More helpful error message
      const errorMsg = error.message || 'Failed to create group'
      if (errorMsg.includes('creator')) {
        toast.error('Error with profile association. Please refresh and try again.')
      } else if (errorMsg.includes('SQL')) {
        toast.error('Database error. Please try again later.')
      } else {
        toast.error(errorMsg)
      }
    }
  }

  const deleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return

    try {
      await groupAPI.delete(id)
      toast.success('Group deleted successfully!')
      fetchGroups()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const openSubscribersModal = async (groupId: string) => {
    setSelectedGroupId(groupId)
    setLoadingSubscribers(true)
    
    try {
      // Fetch all subscribers
      const allSubscribers = await subscriberAPI.getAll()
      setSubscribers(allSubscribers)
      
      // Fetch the specific group to get its subscribers
      const group = await groupAPI.getById(groupId)
      const currentGroup = groups.find(g => g.id === groupId)
      
      if (group && group.group_subscribers) {
        // Extract current subscribers of this group
        const subscriberIds = group.group_subscribers.map(gs => gs.subscriber_id)
        setGroupSubscribers(allSubscribers.filter(sub => subscriberIds.includes(sub.id)))
        setSelectedSubscribers(subscriberIds)
      } else {
        setGroupSubscribers([])
        setSelectedSubscribers([])
      }
      
      setShowSubscribersModal(true)
    } catch (error: any) {
      toast.error("Failed to load subscribers: " + error.message)
    } finally {
      setLoadingSubscribers(false)
    }
  }

  const toggleSubscriber = (subscriberId: string) => {
    setSelectedSubscribers(prev => 
      prev.includes(subscriberId)
        ? prev.filter(id => id !== subscriberId)
        : [...prev, subscriberId]
    )
  }

  const saveGroupSubscribers = async () => {
    if (!selectedGroupId) return
    
    try {
      setLoadingSubscribers(true)
      
      // Find current subscribers of this group
      const currentSubscriberIds = groupSubscribers.map(sub => sub.id)
      
      // Subscribers to add - they're in selectedSubscribers but not in current subscribers
      const subscribersToAdd = selectedSubscribers.filter(id => !currentSubscriberIds.includes(id))
      
      // Subscribers to remove - they're in current subscribers but not in selectedSubscribers
      const subscribersToRemove = currentSubscriberIds.filter(id => !selectedSubscribers.includes(id))
      
      // Add new subscribers
      for (const subscriberId of subscribersToAdd) {
        await groupAPI.addSubscriber(selectedGroupId, subscriberId)
      }
      
      // Remove unselected subscribers
      for (const subscriberId of subscribersToRemove) {
        await groupAPI.removeSubscriber(selectedGroupId, subscriberId)
      }
      
      toast.success("Subscribers updated successfully!")
      fetchGroups()
      setShowSubscribersModal(false)
    } catch (error: any) {
      toast.error("Failed to update subscribers: " + error.message)
    } finally {
      setLoadingSubscribers(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-600 mt-2">
            Organize your subscribers into targeted groups
          </p>
        </div>
        <Button 
          icon={Plus}
          onClick={() => setShowAddModal(true)}
        >
          Create Group
        </Button>
      </div>

      {loading || authLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 mt-2">{authLoading ? 'Loading your profile...' : 'Loading groups...'}</p>
        </div>
      ) : !profile ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Profile not loaded</h3>
            <p className="text-gray-600 mb-4">
              Please refresh the page to load your profile
            </p>
          </CardContent>
        </Card>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first group to start organizing subscribers
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              Create Your First Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Card key={group.id} hover>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {group.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {group.description || 'No description'}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" icon={Edit2} />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={Trash2}
                      onClick={() => deleteGroup(group.id)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      {group._count?.subscribers || 0} subscribers
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(group.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    icon={UserPlus} 
                    onClick={() => openSubscribersModal(group.id)}
                    className="w-full"
                  >
                    Manage Subscribers
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Group Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Create New Group
              </h3>
              <form onSubmit={addGroup} className="space-y-4">
                <Input
                  label="Group Name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({
                    ...newGroup,
                    name: e.target.value
                  })}
                  placeholder="e.g., Newsletter Subscribers"
                  required
                />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({
                      ...newGroup,
                      description: e.target.value
                    })}
                    placeholder="Describe this group..."
                  />
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
                    Create Group
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Manage Subscribers Modal */}
      <Modal
        isOpen={showSubscribersModal}
        onClose={() => setShowSubscribersModal(false)}
        title="Manage Group Subscribers"
        size="lg"
      >
        <div className="p-6">              {loadingSubscribers ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading subscribers...</p>
            </div>
          ): (
            <>
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Search subscribers..."
                  className="mb-4"
                />
                
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Select
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subscribers.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                            No subscribers found
                          </td>
                        </tr>
                      ) : (
                        subscribers.map((subscriber) => (
                          <tr key={subscriber.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Checkbox 
                                checked={selectedSubscribers.includes(subscriber.id)}
                                onChange={() => toggleSubscriber(subscriber.id)}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{subscriber.email}</div>
                              {subscriber.phone && (
                                <div className="text-xs text-gray-500">{subscriber.phone}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {subscriber.first_name || subscriber.last_name
                                  ? `${subscriber.first_name || ''} ${subscriber.last_name || ''}`.trim()
                                  : '—'
                                }
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4">
                <div className="text-sm text-gray-600">
                  {selectedSubscribers.length} subscribers selected
                </div>
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSubscribersModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveGroupSubscribers}
                    disabled={loadingSubscribers}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}