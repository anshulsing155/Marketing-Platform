import React from 'react'
import { Modal } from './ui/Modal'
import { Smartphone, Monitor } from 'lucide-react'
import { Button } from './ui/Button'

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  content: string
  type: 'email' | 'whatsapp'
}

export function PreviewModal({ isOpen, onClose, title, content, type }: PreviewModalProps) {
  const [viewMode, setViewMode] = React.useState<'desktop' | 'mobile'>('desktop')

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Preview: ${title}`} size="xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'desktop' ? 'primary' : 'outline'}
              size="sm"
              icon={Monitor}
              onClick={() => setViewMode('desktop')}
            >
              Desktop
            </Button>
            <Button
              variant={viewMode === 'mobile' ? 'primary' : 'outline'}
              size="sm"
              icon={Smartphone}
              onClick={() => setViewMode('mobile')}
            >
              Mobile
            </Button>
          </div>
          <span className="text-sm text-gray-500 capitalize">{type} Preview</span>
        </div>

        <div className="flex justify-center">
          <div className={`
            border border-gray-300 rounded-lg overflow-hidden shadow-lg
            ${viewMode === 'desktop' ? 'w-full max-w-4xl' : 'w-80'}
            ${viewMode === 'mobile' ? 'h-[600px]' : 'min-h-[500px]'}
          `}>
            {type === 'email' ? (
              <iframe
                srcDoc={content}
                className="w-full h-full border-0"
                title="Email Preview"
              />
            ) : (
              <div className="p-4 bg-green-50 h-full">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">W</span>
                    </div>
                    <span className="ml-2 font-medium text-gray-900">WhatsApp Business</span>
                  </div>
                  <div className="bg-green-100 rounded-lg p-3 max-w-xs">
                    <div className="whitespace-pre-wrap text-sm text-gray-800">
                      {content}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}