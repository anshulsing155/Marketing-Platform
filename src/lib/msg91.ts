import axios from 'axios'

const MSG91_API_KEY = import.meta.env.VITE_MSG91_API_KEY
const MSG91_BASE_URL = 'https://control.msg91.com/api/v5'

export interface WhatsAppMessage {
  to: string
  template_id?: string
  message?: string
  media_url?: string
  media_type?: 'image' | 'video' | 'document'
}

export class MSG91Service {
  private apiKey: string

  constructor(apiKey: string = MSG91_API_KEY) {
    this.apiKey = apiKey
  }

  async sendWhatsAppMessage(message: WhatsAppMessage): Promise<any> {
    try {
      const response = await axios.post(
        `${MSG91_BASE_URL}/whatsapp/whatsapp-outbound-message/bulk/`,
        {
          integrated_number: import.meta.env.VITE_MSG91_WHATSAPP_NUMBER,
          content_type: 'template',
          payload: [
            {
              to: message.to,
              type: 'text',
              text: message.message || '',
              ...(message.media_url && {
                media: {
                  type: message.media_type || 'image',
                  url: message.media_url
                }
              })
            }
          ]
        },
        {
          headers: {
            'Authkey': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      )
      return response.data
    } catch (error) {
      console.error('MSG91 WhatsApp API Error:', error)
      throw error
    }
  }

  async sendBulkWhatsAppMessages(messages: WhatsAppMessage[]): Promise<any> {
    try {
      const payload = messages.map(message => ({
        to: message.to,
        type: 'text',
        text: message.message || '',
        ...(message.media_url && {
          media: {
            type: message.media_type || 'image',
            url: message.media_url
          }
        })
      }))

      const response = await axios.post(
        `${MSG91_BASE_URL}/whatsapp/whatsapp-outbound-message/bulk/`,
        {
          integrated_number: import.meta.env.VITE_MSG91_WHATSAPP_NUMBER,
          content_type: 'template',
          payload
        },
        {
          headers: {
            'Authkey': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      )
      return response.data
    } catch (error) {
      console.error('MSG91 Bulk WhatsApp API Error:', error)
      throw error
    }
  }

  async getWhatsAppStatus(requestId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${MSG91_BASE_URL}/whatsapp/whatsapp-outbound-message/status/${requestId}`,
        {
          headers: {
            'Authkey': this.apiKey
          }
        }
      )
      return response.data
    } catch (error) {
      console.error('MSG91 Status API Error:', error)
      throw error
    }
  }
}

export const msg91Service = new MSG91Service()