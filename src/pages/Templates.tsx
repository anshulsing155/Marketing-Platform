import React, { useState, useEffect } from 'react'
import { Plus, BookTemplate as Template, Trash2, Edit2, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PreviewModal } from '../components/PreviewModal'
import { emailTemplateAPI } from '../lib/api'

import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  created_at: string
  updated_at: string
}

export function Templates() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    content: ''
  })

  const predefinedTemplates = [
    {
      name: 'Welcome Email',
      subject: 'Welcome to our community!',
      content: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome aboard!</h1>
          </div>
          <div style="padding: 40px 20px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi there!</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              We're thrilled to have you join our community. Get ready for exclusive content, 
              updates, and special offers delivered right to your inbox.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Get Started
              </a>
            </div>
            <p style="color: #666; line-height: 1.6;">
              If you have any questions, feel free to reach out to us anytime.
            </p>
          </div>
        </div>
      `
    },
    {
      name: 'Newsletter',
      subject: 'Your weekly update is here',
      content: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #007bff;">
            <h1 style="color: #333; margin: 0; font-size: 24px;">Weekly Newsletter</h1>
            <p style="color: #666; margin: 10px 0 0 0;">Stay updated with our latest news</p>
          </div>
          <div style="padding: 30px 20px; background: white;">
            <div style="margin-bottom: 30px;">
              <h2 style="color: #333; margin-bottom: 15px; font-size: 20px;">This Week's Highlights</h2>
              <div style="border-left: 4px solid #007bff; padding-left: 20px; margin-bottom: 20px;">
                <h3 style="color: #333; margin: 0 0 10px 0;">Feature Update</h3>
                <p style="color: #666; line-height: 1.6; margin: 0;">
                  We've rolled out some exciting new features that will make your experience even better.
                </p>
              </div>
              <div style="border-left: 4px solid #28a745; padding-left: 20px;">
                <h3 style="color: #333; margin: 0 0 10px 0;">Community Spotlight</h3>
                <p style="color: #666; line-height: 1.6; margin: 0;">
                  Check out what our amazing community members have been up to this week.
                </p>
              </div>
            </div>
            <div style="text-align: center;">
              <a href="#" style="background: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Read More
              </a>
            </div>
          </div>
        </div>
      `
    },
    {
      name: 'Product Launch',
      subject: 'Introducing our latest product',
      content: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🚀 New Product Launch</h1>
          </div>
          <div style="padding: 40px 20px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px; text-align: center;">Something amazing is here!</h2>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
                <h3 style="color: #333; margin-bottom: 15px;">Our Latest Innovation</h3>
                <p style="color: #666; line-height: 1.6;">
                  After months of development, we're excited to introduce a product that will 
                  revolutionize the way you work and play.
                </p>
              </div>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: #ff6b6b; color: white; padding: 15px 35px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px;">
                Learn More
              </a>
            </div>
            <p style="color: #666; line-height: 1.6; text-align: center; font-size: 14px;">
              Be among the first to experience this game-changing product.
            </p>
          </div>
        </div>
      `
    }
  ]

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const data = await emailTemplateAPI.getAll()
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }

  const createTemplate = async (template: typeof newTemplate) => {
    if (!user) return

    try {
      const now = new Date().toISOString();
      await emailTemplateAPI.create({
        ...template,
        created_by: user.id,
        created_at: now,
        updated_at: now
      })

      toast.success('Template created successfully!')
      fetchTemplates()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault()
    await createTemplate(newTemplate)
    setShowCreateModal(false)
    setNewTemplate({ name: '', subject: '', content: '' })
  }

  const handleCreatePredefined = async (template: any) => {
    await createTemplate(template)
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await emailTemplateAPI.delete(id)

      toast.success('Template deleted successfully!')
      fetchTemplates()
    } catch (error: any) {
      toast.error(error.message)
    }
  }


  const handlePreview = (template: EmailTemplate) => {
    setPreviewTemplate(template)
    setShowPreviewModal(true)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600 mt-2">
            Create and manage your email templates
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {predefinedTemplates.map((template, index) => (
            <Card key={index} hover>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                  </div>
                  <Template className="w-8 h-8 text-blue-600" />
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Templates</h2>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Template className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No custom templates yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first custom template or use one of our quick start templates above
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
                      <p className="text-sm text-gray-600">
                        {template.subject}
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
        title="Create Email Template"
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
              placeholder="e.g., Monthly Newsletter"
              required
            />
            <Input
              label="Email Subject"
              value={newTemplate.subject}
              onChange={(e) => setNewTemplate({
                ...newTemplate,
                subject: e.target.value
              })}
              placeholder="e.g., Your monthly update is here"
              required
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Email Content (HTML)
              </label>
              <textarea
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows={12}
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({
                  ...newTemplate,
                  content: e.target.value
                })}
                placeholder="Enter your HTML email content here..."
                required
              />
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
          type="email"
        />
      )}
    </div>
  )
}
