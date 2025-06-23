import { useState, useEffect } from 'react'
import { User, Bell, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../contexts/AuthContext'
import { profileAPI } from '../lib/api'
import toast from 'react-hot-toast'

export function Settings() {
  const { profile, user } = useAuth()
  const [formData, setFormData] = useState({
    full_name: ''
  })
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || ''
      })
    }
  }, [profile])
  
  const saveProfileChanges = async () => {
    if (!user || !profile) return

    setLoading(true)
    try {
      await profileAPI.update(user.id, {
        full_name: formData.full_name
      })
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
                placeholder="Enter your full name"
              />
              <Input
                label="Email Address"
                type="email"
                value={profile?.email || ''}
                disabled
                helper="Email cannot be changed"
              />
              <Input
                label="Role"
                value={profile?.role || ''}
                disabled
                helper="Role is assigned by administrators"
              />
              <div className="pt-4">
                <Button 
                  onClick={saveProfileChanges}
                  loading={loading}
                  disabled={!formData.full_name || formData.full_name === profile?.full_name}
                >
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Email notifications for campaign updates
                  </span>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    defaultChecked
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Weekly analytics reports
                  </span>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    defaultChecked
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Security alerts
                  </span>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    defaultChecked
                  />
                </label>
              </div>
              <div className="pt-4">
                <Button>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Security</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Change Password</h4>
                  <div className="space-y-3">
                    <Input
                      label="Current Password"
                      type="password"
                      placeholder="Enter current password"
                    />
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="Enter new password"
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <Button>Update Password</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Info Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Plan</p>
                <p className="font-medium">Free Plan</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Member since</p>
                <p className="font-medium">January 2024</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email quota</p>
                <p className="font-medium">1,000 / 10,000 emails</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Need Help?</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Get in touch with our support team if you need assistance.
              </p>
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}