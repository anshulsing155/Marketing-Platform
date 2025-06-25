import React, { useState, useEffect } from 'react'
import { Plus, MessageCircle, Trash2, Edit2, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PreviewModal } from '../components/PreviewModal'
import { whatsappTemplateAPI } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface WhatsAppTemplate {
  id: string
  name: string
  content: string
  created_at: string
  updated_at: string
}

export function WhatsAppTemplates() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<WhatsAppTemplate | null>(null)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: ''
  })

  const predefinedTemplates = [
    {
      name: 'Welcome Message',
      content: `🎉 Welcome to our community!

Hi {{name}}, 

Thank you for joining us! We're excited to have you on board.

You'll receive updates about:
✅ New products & services
✅ Exclusive offers
✅ Important announcements

Reply STOP to unsubscribe anytime.

Best regards,
Team MailFlow`
    },
    {
      name: 'Order Confirmation',
      content: `📦 Order Confirmed!

Hi {{name}},

Your order #{{order_id}} has been confirmed.

Order Details:
• Total: {{amount}}
• Delivery: {{delivery_date}}
• Address: {{address}}

Track your order: {{tracking_link}}

Thank you for shopping with us! 🛍️`
    },
    {
      name: 'Promotional Offer',
      content: `🔥 Special Offer Just for You!

Hi {{name}},

Get {{discount}}% OFF on your next purchase!

Use code: {{promo_code}}
Valid until: {{expiry_date}}

Shop now: {{shop_link}}

Don't miss out! 🛒

Terms & conditions apply.`
    },
    {
      name: 'Appointment Reminder',
      content: `📅 Appointment Reminder

Hi {{name}},

This is a reminder for your appointment:

📍 Date: {{date}}
🕐 Time: {{time}}
📍 Location: {{location}}

Please arrive 10 minutes early.

Need to reschedule? Reply to this message.

See you soon! 👋`
    }
  ]

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const data = await whatsappTemplateAPI.getAll()
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching WhatsApp templates:', error)
      toast.error('Failed to fetch WhatsApp templates')
    } finally {
      setLoading(false)
    }
  }

  const createTemplate = async (template: typeof newTemplate) => {
    if (!user) return

    try {
      const now = new Date().toISOString();
      await whatsappTemplateAPI.create({
        ...template,
        created_by: user.id,
        created_at: now,
        updated_at: now
      })

      toast.success('WhatsApp template created successfully!')
      fetchTemplates()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault()
    await createTemplate(newTemplate)
    setShowCreateModal(false)
    setNewTemplate({ name: '', content: '' })
  }

  const handleCreatePredefined = async (template: any) => {
    await createTemplate(template)
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this WhatsApp template?')) return

    try {
      await whatsappTemplateAPI.delete(id)

      toast.success('WhatsApp template deleted successfully!')
      fetchTemplates()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handlePreview = (template: WhatsAppTemplate) => {
    setPreviewTemplate(template)
    setShowPreviewModal(true)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Templates</h1>
          <p className="text-gray-600 mt-2">
            Create and manage your WhatsApp message templates
          </p>
        </div>
        <Button 
          icon={Plus}
          onClick={() => setShowCreateModal(true)}
        >
          Create Template
        </Button>
      </div>

      {/* Predefined Templates */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Start Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {predefinedTemplates.map((template, index) => (
            <Card key={index} hover>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {template.content.substring(0, 60)}...
                    </p>
                  </div>
                  <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => handleCreatePredefined(template)}
                >
                  Use This Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Templates */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your WhatsApp Templates</h2>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No WhatsApp templates yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first WhatsApp template or use one of our quick start templates above
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} hover>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {template.content.substring(0, 100)}...
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={Eye}
                        onClick={() => handlePreview(template)}
                      />
                      <Button variant="ghost" size="sm" icon={Edit2} />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={Trash2}
                        onClick={() => deleteTemplate(template.id)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-gray-500">
                    Created {new Date(template.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create WhatsApp Template"
        size="lg"
      >
        <div className="p-6">
          <form onSubmit={handleCreateCustom} className="space-y-4">
            <Input
              label="Template Name"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({
                ...newTemplate,
                name: e.target.value
              })}
              placeholder="e.g., Welcome Message"
              required
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Message Content
              </label>
              <textarea
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={8}
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({
                  ...newTemplate,
                  content: e.target.value
                })}
                placeholder="Enter your WhatsApp message content here..."
                required
              />
              <p className="text-xs text-gray-500">
                Use variables like {`{{name}}`}, {`{{order_id}}`}, etc. for personalization
              </p>
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
                Create Template
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Preview Modal */}
      {previewTemplate && (
        <PreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title={previewTemplate.name}
          content={previewTemplate.content}
          type="whatsapp"
        />
      )}
    </div>
  )
}
