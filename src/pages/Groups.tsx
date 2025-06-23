import React, { useState, useEffect } from 'react'
import { Plus, Users, Trash2, Edit2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface Group {
  id: string
  name: string
  description: string | null
  created_at: string
  subscriber_count?: number
}

export function Groups() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('user_groups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Get subscriber counts for each group
      const groupsWithCounts = await Promise.all(
        (data || []).map(async (group) => {
          const { count } = await supabase
            .from('group_subscribers')
            .select('id', { count: 'exact' })
            .eq('group_id', group.id)
          
          return {
            ...group,
            subscriber_count: count || 0
          }
        })
      )
      
      setGroups(groupsWithCounts)
    } catch (error) {
      console.error('Error fetching groups:', error)
      toast.error('Failed to fetch groups')
    } finally {
      setLoading(false)
    }
  }

  const addGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    try {
      const { error } = await supabase
        .from('user_groups')
        .insert([{
          name: newGroup.name,
          description: newGroup.description || null,
          created_by: user.id
        }])

      if (error) throw error
      
      toast.success('Group created successfully!')
      setShowAddModal(false)
      setNewGroup({ name: '', description: '' })
      fetchGroups()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const deleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return

    try {
      const { error } = await supabase
        .from('user_groups')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      toast.success('Group deleted successfully!')
      fetchGroups()
    } catch (error: any) {
      toast.error(error.message)
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

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading groups...</p>
        </div>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    {group.subscriber_count} subscribers
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(group.created_at).toLocaleDateString()}
                  </span>
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
    </div>
  )
}