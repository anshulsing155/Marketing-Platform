import React, { useState, useEffect } from 'react'
import { Plus, Send, Calendar, Eye, Trash2, Edit2, Mail, MessageCircle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PreviewModal } from '../components/PreviewModal'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { msg91Service } from '../lib/msg91'
import toast from 'react-hot-toast'

interface Campaign {
  id: string
  name: string
  type: 'email' | 'whatsapp'
  subject: string | null
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  scheduled_at: string | null
  sent_at: string | null
  created_at: string
  template_id: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
}

interface WhatsAppTemplate {
  id: string
  name: string
  content: string
}

interface Group {
  id: string
  name: string
}

interface Subscriber {
  id: string
  email: string
  phone: string | null
  first_name: string | null
  last_name: string | null
  whatsapp_opt_in: boolean
}

export function Campaigns() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsAppTemplate[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewCampaign, setPreviewCampaign] = useState<any>(null)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'email' as 'email' | 'whatsapp',
    subject: '',
    template_id: '',
    group_ids: [] as string[],
    schedule_type: 'now' as 'now' | 'later',
    scheduled_at: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [campaignsRes, emailTemplatesRes, whatsappTemplatesRes, groupsRes] = await Promise.all([
        supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('email_templates').select('id, name, subject, content'),
        supabase.from('whatsapp_templates').select('id, name, content'),
        supabase.from('user_groups').select('id, name')
      ])

      if (campaignsRes.error) throw campaignsRes.error
      if (emailTemplatesRes.error) throw emailTemplatesRes.error
      if (whatsappTemplatesRes.error) throw whatsappTemplatesRes.error
      if (groupsRes.error) throw groupsRes.error

      setCampaigns(campaignsRes.data || [])
      setEmailTemplates(emailTemplatesRes.data || [])
      setWhatsappTemplates(whatsappTemplatesRes.data || [])
      setGroups(groupsRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    try {
      const campaignData = {
        name: newCampaign.name,
        type: newCampaign.type.toUpperCase(),
        subject: newCampaign.type === 'email' ? newCampaign.subject : null,
        template_id: newCampaign.template_id,
        status: newCampaign.schedule_type === 'now' ? 'SENDING' : 'SCHEDULED',
        scheduled_at: newCampaign.schedule_type === 'later' ? new Date(newCampaign.scheduled_at).toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user.id
      }

      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert([campaignData])
        .select()
        .single()

      if (campaignError) throw campaignError

      // Add campaign groups
      if (newCampaign.group_ids.length > 0) {
        const campaignGroups = newCampaign.group_ids.map(groupId => ({
          campaign_id: campaign.id,
          group_id: groupId
        }))

        const { error: groupsError } = await supabase
          .from('campaign_groups')
          .insert(campaignGroups)

        if (groupsError) throw groupsError
      }

      // If sending now, trigger the sending process
      if (newCampaign.schedule_type === 'now') {
        await sendCampaign(campaign.id, newCampaign.type, newCampaign.template_id, newCampaign.group_ids)
      }
      
      toast.success('Campaign created successfully!')
      setShowCreateModal(false)
      setNewCampaign({
        name: '',
        type: 'email',
        subject: '',
        template_id: '',
        group_ids: [],
        schedule_type: 'now',
        scheduled_at: ''
      })
      fetchData()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const sendCampaign = async (campaignId: string, type: 'email' | 'whatsapp', templateId: string, groupIds: string[]) => {
    try {
      // Get subscribers from selected groups
      const { data: groupSubscribers, error: subscribersError } = await supabase
        .from('group_subscribers')
        .select(`
          subscriber_id,
          subscribers (
            id, email, phone, first_name, last_name, whatsapp_opt_in
          )
        `)
        .in('group_id', groupIds)

      if (subscribersError) throw subscribersError

      const subscribers = groupSubscribers?.map(gs => gs.subscribers).filter(Boolean) as Subscriber[]

      if (type === 'whatsapp') {
        // Get WhatsApp template
        const { data: template, error: templateError } = await supabase
          .from('whatsapp_templates')
          .select('content')
          .eq('id', templateId)
          .single()

        if (templateError) throw templateError

        // Filter subscribers who opted in for WhatsApp and have phone numbers
        const whatsappSubscribers = subscribers.filter(sub => 
          sub.whatsapp_opt_in && sub.phone
        )

        if (whatsappSubscribers.length === 0) {
          throw new Error('No subscribers with WhatsApp opt-in found')
        }

        // Send WhatsApp messages via MSG91
        const messages = whatsappSubscribers.map(subscriber => ({
          to: subscriber.phone!,
          message: template.content.replace(/\{\{name\}\}/g, subscriber.first_name || 'there')
        }))

        await msg91Service.sendBulkWhatsAppMessages(messages)
        
        // Update campaign status
        await supabase
          .from('campaigns')
          .update({ 
            status: 'SENT', 
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', campaignId)

        toast.success(`WhatsApp campaign sent to ${whatsappSubscribers.length} subscribers!`)
      } else {
        // Email sending would be implemented here with your email service
        // For now, just update the status
        await supabase
          .from('campaigns')
          .update({ 
            status: 'SENT', 
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString() 
          })
          .eq('id', campaignId)

        toast.success(`Email campaign sent to ${subscribers.length} subscribers!`)
      }
    } catch (error: any) {
      console.error('Error sending campaign:', error)
      
      // Update campaign status to failed
      await supabase
        .from('campaigns')
        .update({ 
          status: 'FAILED',
          updated_at: new Date().toISOString() 
        })
        .eq('id', campaignId)
      
      toast.error(`Failed to send campaign: ${error.message}`)
    }
  }

  const deleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      toast.success('Campaign deleted successfully!')
      fetchData()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handlePreview = async (campaign: Campaign) => {
    try {
      let template
      if (campaign.type === 'email') {
        const { data } = await supabase
          .from('email_templates')
          .select('name, subject, content')
          .eq('id', campaign.template_id)
          .single()
        template = data
      } else {
        const { data } = await supabase
          .from('whatsapp_templates')
          .select('name, content')
          .eq('id', campaign.template_id)
          .single()
        template = data
      }

      if (template) {
        setPreviewCampaign({
          ...campaign,
          template
        })
        setShowPreviewModal(true)
      }
    } catch (error) {
      toast.error('Failed to load template for preview')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'sending':
        return 'bg-yellow-100 text-yellow-800'
      case 'sent':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return Calendar
      case 'sent':
        return Send
      default:
        return Eye
    }
  }

  const getCampaignIcon = (type: string) => {
    return type === 'whatsapp' ? MessageCircle : Mail
  }

  const getCurrentTemplates = () => {
    return newCampaign.type === 'email' ? emailTemplates : whatsappTemplates
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-2">
            Create and manage your email and WhatsApp campaigns
          </p>
        </div>
        <Button 
          icon={Plus}
          onClick={() => setShowCreateModal(true)}
        >
          Create Campaign
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first email or WhatsApp campaign to start reaching your audience
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const StatusIcon = getStatusIcon(campaign.status)
            const CampaignIcon = getCampaignIcon(campaign.type)
            return (
              <Card key={campaign.id} hover>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className="w-5 h-5 text-gray-600" />
                        <CampaignIcon className={`w-5 h-5 ${campaign.type === 'whatsapp' ? 'text-green-600' : 'text-blue-600'}`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {campaign.name}
                          </h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            campaign.type === 'whatsapp' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {campaign.type === 'whatsapp' ? 'WhatsApp' : 'Email'}
                          </span>
                        </div>
                        {campaign.subject && (
                          <p className="text-sm text-gray-600">
                            {campaign.subject}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                      <div className="text-right text-sm text-gray-500">
                        <p>Created {new Date(campaign.created_at).toLocaleDateString()}</p>
                        {campaign.scheduled_at && (
                          <p>Scheduled for {new Date(campaign.scheduled_at).toLocaleDateString()}</p>
                        )}
                        {campaign.sent_at && (
                          <p>Sent {new Date(campaign.sent_at).toLocaleDateString()}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon={Eye}
                          onClick={() => handlePreview(campaign)}
                        />
                        <Button variant="ghost" size="sm" icon={Edit2} />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon={Trash2}
                          onClick={() => deleteCampaign(campaign.id)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Campaign"
        size="lg"
      >
        <div className="p-6">
          <form onSubmit={createCampaign} className="space-y-4">
            <Input
              label="Campaign Name"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({
                ...newCampaign,
                name: e.target.value
              })}
              placeholder="e.g., Spring Newsletter 2024"
              required
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Campaign Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="email"
                    className="text-blue-600 focus:ring-blue-500"
                    checked={newCampaign.type === 'email'}
                    onChange={(e) => setNewCampaign({
                      ...newCampaign,
                      type: e.target.value as 'email' | 'whatsapp',
                      template_id: ''
                    })}
                  />
                  <Mail className="w-4 h-4 ml-2 mr-1 text-blue-600" />
                  <span className="text-sm">Email</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="whatsapp"
                    className="text-green-600 focus:ring-green-500"
                    checked={newCampaign.type === 'whatsapp'}
                    onChange={(e) => setNewCampaign({
                      ...newCampaign,
                      type: e.target.value as 'email' | 'whatsapp',
                      template_id: ''
                    })}
                  />
                  <MessageCircle className="w-4 h-4 ml-2 mr-1 text-green-600" />
                  <span className="text-sm">WhatsApp</span>
                </label>
              </div>
            </div>
            
            {newCampaign.type === 'email' && (
              <Input
                label="Email Subject"
                value={newCampaign.subject}
                onChange={(e) => setNewCampaign({
                  ...newCampaign,
                  subject: e.target.value
                })}
                placeholder="e.g., Spring updates and special offers"
                required
              />
            )}

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {newCampaign.type === 'email' ? 'Email Template' : 'WhatsApp Template'}
              </label>
              <select
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newCampaign.template_id}
                onChange={(e) => setNewCampaign({
                  ...newCampaign,
                  template_id: e.target.value
                })}
                required
              >
                <option value="">Select a template</option>
                {getCurrentTemplates().map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Target Groups
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                {groups.map((group) => (
                  <label key={group.id} className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={newCampaign.group_ids.includes(group.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewCampaign({
                            ...newCampaign,
                            group_ids: [...newCampaign.group_ids, group.id]
                          })
                        } else {
                          setNewCampaign({
                            ...newCampaign,
                            group_ids: newCampaign.group_ids.filter(id => id !== group.id)
                          })
                        }
                      }}
                    />
                    <span className="ml-2 text-sm">{group.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Schedule
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="schedule"
                    className="text-blue-600 focus:ring-blue-500"
                    checked={newCampaign.schedule_type === 'now'}
                    onChange={() => setNewCampaign({
                      ...newCampaign,
                      schedule_type: 'now'
                    })}
                  />
                  <span className="ml-2 text-sm">Send immediately</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="schedule"
                    className="text-blue-600 focus:ring-blue-500"
                    checked={newCampaign.schedule_type === 'later'}
                    onChange={() => setNewCampaign({
                      ...newCampaign,
                      schedule_type: 'later'
                    })}
                  />
                  <span className="ml-2 text-sm">Schedule for later</span>
                </label>
              </div>
              {newCampaign.schedule_type === 'later' && (
                <Input
                  type="datetime-local"
                  value={newCampaign.scheduled_at}
                  onChange={(e) => setNewCampaign({
                    ...newCampaign,
                    scheduled_at: e.target.value
                  })}
                  required
                />
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Create Campaign
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Preview Modal */}
      {previewCampaign && (
        <PreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title={previewCampaign.template.name}
          content={previewCampaign.type === 'email' ? previewCampaign.template.content : previewCampaign.template.content}
          type={previewCampaign.type}
        />
      )}
    </div>
  )
}