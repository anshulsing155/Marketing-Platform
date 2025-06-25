import React, { useState, useEffect } from 'react'
import { Plus, Send, Calendar, Eye, Trash2, Edit2, Mail, MessageCircle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PreviewModal } from '../components/PreviewModal'
import { emailTemplateAPI, whatsappTemplateAPI, groupAPI, campaignAPI } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
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
  template_id?: string | null
  whatsapp_template_id?: string | null
  group_id?: string
  content?: string | null
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
    template_id: '', // For email templates
    whatsapp_template_id: '', // For WhatsApp templates
    group_id: '', // Single group selection instead of multiple groups
    schedule_type: 'now' as 'now' | 'later',
    scheduled_at: ''
  })

  useEffect(() => {
    fetchData()
  }, [])
  const fetchData = async () => {
    try {
      // Use API for campaigns, templates, and groups
      const [campaignsRes, emailTemplatesRes, whatsappTemplatesRes, groupsRes] = await Promise.all([
        campaignAPI.getAll(),
        emailTemplateAPI.getAll(),
        whatsappTemplateAPI.getAll(),
        groupAPI.getAll()
      ])

      // Make sure campaignRes is transformed from our API to match expected format
      const formattedCampaigns = Array.isArray(campaignsRes) 
        ? campaignsRes.map(c => ({
            ...c,
            // Convert uppercase type and status to lowercase for frontend consistency
            type: c.type?.toLowerCase() as 'email' | 'whatsapp',
            status: c.status?.toLowerCase() as 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed',
            scheduled_at: c.scheduled_at ? new Date(c.scheduled_at).toISOString() : null,
            sent_at: c.sent_at ? new Date(c.sent_at).toISOString() : null,
            created_at: c.created_at ? new Date(c.created_at).toISOString() : '',
          }))
        : [];

      setCampaigns(formattedCampaigns)
      setEmailTemplates(emailTemplatesRes)
      setWhatsappTemplates(whatsappTemplatesRes)
      setGroups(groupsRes)
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
      if (!newCampaign.group_id) {
        throw new Error('Please select a group for your campaign');
      }

      // Validate selected template exists
      if (newCampaign.type === 'email') {
        const emailTemplate = emailTemplates.find(t => t.id === newCampaign.template_id);
        if (!emailTemplate) {
          throw new Error('Selected email template does not exist.');
        }
      } else if (newCampaign.type === 'whatsapp') {
        const whatsappTemplate = whatsappTemplates.find(t => t.id === newCampaign.whatsapp_template_id);
        if (!whatsappTemplate) {
          throw new Error('Selected WhatsApp template does not exist.');
        }
      }

      // Prepare campaign data based on campaign type
      const campaignData: any = {
        name: newCampaign.name,
        type: newCampaign.type.toUpperCase() as 'EMAIL' | 'WHATSAPP',
        subject: newCampaign.type === 'email' ? newCampaign.subject : null,
        status: newCampaign.schedule_type === 'now' ? 'SENDING' : 'SCHEDULED',
        scheduled_at: newCampaign.schedule_type === 'later' ? new Date(newCampaign.scheduled_at).toISOString() : null,
        created_by: user.id,
        // Removed group_id here because it's not a direct field in campaign model
      };

      console.log('Creating campaign with type:', newCampaign.type);
      
      // Set the appropriate template field based on campaign type
      if (newCampaign.type === 'email') {
        campaignData.email_template_id = newCampaign.template_id;
      } else if (newCampaign.type === 'whatsapp') {
        campaignData.whatsapp_template_id = newCampaign.whatsapp_template_id;
      }

      console.log('Creating campaign with data:', campaignData);
      
      // Use the server API to create the campaign
      const campaign = await campaignAPI.create(campaignData);

      // Create campaign-group association
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/campaign_groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaign.id, group_id: newCampaign.group_id }),
        credentials: 'include',
      }).catch(error => {
        console.error('Error creating campaign-group association:', error);
        toast.error('Failed to associate campaign with group');
      });


      // If sending now, trigger the sending process
      if (newCampaign.schedule_type === 'now') {
        await sendCampaign(campaign.id).catch(error => {
          console.error('Error sending campaign:', error);
          toast.error('Failed to send campaign');
        });
      }
      
      toast.success('Campaign created successfully!')
      setShowCreateModal(false)
      setNewCampaign({
        name: '',
        type: 'email',
        subject: '',
        template_id: '',
        whatsapp_template_id: '',
        group_id: '',
        schedule_type: 'now',
        scheduled_at: ''
      });
      fetchData()
    } catch (error: any) {
      console.error('Create campaign error:', error);
        // Handle various error formats (both from API and direct Supabase)
      const errorMessage = 
        error.message || 
        (error.error && typeof error.error === 'string' ? error.error : null) ||
        'Failed to create campaign';
        
      if (error.status === 409 || errorMessage.includes('already exists')) {
        toast.error('A campaign with this name or data already exists. Please use a different name.');
      } else if (
        errorMessage.includes('violates foreign key constraint') || 
        errorMessage.includes('foreign key constraint failed')
      ) {
        if (errorMessage.includes('FK_Campaign_WhatsAppTemplate') || errorMessage.includes('whatsapp_template_id')) {
          toast.error('The selected WhatsApp template does not exist. Please choose a valid template.');
        } else if (errorMessage.includes('FK_Campaign_EmailTemplate') || errorMessage.includes('template_id')) {
          toast.error('The selected email template does not exist. Please choose a valid template.');
        } else if (errorMessage.includes('created_by')) {
          toast.error('Your user profile is not properly linked. Please refresh the page and try again.');
        } else if (errorMessage.includes('group_id')) {
          toast.error('The selected group does not exist. Please choose a valid group.');
        } else {
          toast.error('A reference error occurred. Some selected items may not exist.');
        }
      } else {
        toast.error(errorMessage);
      }
    }
  }

  const sendCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send campaign');
      }

      toast.success(data.message);
      fetchData();
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      toast.error(`Failed to send campaign: ${error.message}`);
    }
  }

  const deleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      await campaignAPI.delete(id);
      toast.success('Campaign deleted successfully!');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      toast.error(error.message || 'Failed to delete campaign');
    }
  }

  const handlePreview = async (campaign: Campaign) => {
    try {
      let template;
      if (campaign.type === 'email') {
        template = await emailTemplateAPI.getById(campaign.template_id || '');
      } else {
        template = await whatsappTemplateAPI.getById(campaign.template_id || '');
      }

      if (template) {
        setPreviewCampaign({
          ...campaign,
          template
        });
        setShowPreviewModal(true);
      }
    } catch (error) {
      toast.error('Failed to load template for preview');
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
                    className="text-blue-600 focus:ring-blue-500"                    checked={newCampaign.type === 'email'}
                    onChange={(e) => setNewCampaign({
                      ...newCampaign,
                      type: e.target.value as 'email' | 'whatsapp',
                      template_id: '',
                      whatsapp_template_id: ''
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
                    className="text-green-600 focus:ring-green-500"                    checked={newCampaign.type === 'whatsapp'}
                    onChange={(e) => setNewCampaign({
                      ...newCampaign,
                      type: e.target.value as 'email' | 'whatsapp',
                      template_id: '',
                      whatsapp_template_id: ''
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
            )}            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {newCampaign.type === 'email' ? 'Email Template' : 'WhatsApp Template'}
              </label>
              <select
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newCampaign.type === 'email' ? newCampaign.template_id : newCampaign.whatsapp_template_id}
                onChange={(e) => {
                  if (newCampaign.type === 'email') {
                    setNewCampaign({
                      ...newCampaign,
                      template_id: e.target.value
                    });
                  } else {
                    setNewCampaign({
                      ...newCampaign,
                      whatsapp_template_id: e.target.value
                    });
                  }
                }}
                required
              >
                <option value="">Select a template</option>
                {getCurrentTemplates().map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Target Group
              </label>
              <select
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newCampaign.group_id}
                onChange={(e) => setNewCampaign({
                  ...newCampaign,
                  group_id: e.target.value
                })}
                required
              >
                <option value="">Select a group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
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
