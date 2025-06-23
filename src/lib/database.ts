import { prisma, handlePrismaError } from './prisma'
import type { 
  Profile, 
  Subscriber, 
  UserGroup, 
  EmailTemplate, 
  WhatsAppTemplate, 
  Campaign,
  CampaignType,
  CampaignStatus,
  SubscriberStatus 
} from '@prisma/client'

// Profile operations
export const profileService = {
  async getById(id: string): Promise<Profile | null> {
    try {
      return await prisma.profile.findUnique({
        where: { id }
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async create(data: {
    id: string
    email: string
    full_name?: string
    role?: 'ADMIN' | 'USER'
  }): Promise<Profile> {
    try {
      return await prisma.profile.create({
        data
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async update(id: string, data: Partial<Profile>): Promise<Profile> {
    try {
      return await prisma.profile.update({
        where: { id },
        data
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  }
}

// Subscriber operations
export const subscriberService = {
  async getAll(): Promise<Subscriber[]> {
    try {
      return await prisma.subscriber.findMany({
        orderBy: { created_at: 'desc' }
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async getById(id: string): Promise<Subscriber | null> {
    try {
      return await prisma.subscriber.findUnique({
        where: { id },
        include: {
          group_subscribers: {
            include: {
              group: true
            }
          }
        }
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async create(data: {
    email: string
    phone?: string
    first_name?: string
    last_name?: string
    whatsapp_opt_in?: boolean
    status?: SubscriberStatus
  }): Promise<Subscriber> {
    try {
      return await prisma.subscriber.create({
        data
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async update(id: string, data: Partial<Subscriber>): Promise<Subscriber> {
    try {
      return await prisma.subscriber.update({
        where: { id },
        data
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await prisma.subscriber.delete({
        where: { id }
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async bulkDelete(ids: string[]): Promise<void> {
    try {
      await prisma.subscriber.deleteMany({
        where: {
          id: { in: ids }
        }
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async getByGroupId(groupId: string): Promise<Subscriber[]> {
    try {
      return await prisma.subscriber.findMany({
        where: {
          group_subscribers: {
            some: {
              group_id: groupId
            }
          }
        }
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  }
}

// Group operations
export const groupService = {
  async getAll(userId: string): Promise<UserGroup[]> {
    try {
      return await prisma.userGroup.findMany({
        where: { created_by: userId },
        include: {
          _count: {
            select: {
              group_subscribers: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async getById(id: string): Promise<UserGroup | null> {
    try {
      return await prisma.userGroup.findUnique({
        where: { id },
        include: {
          group_subscribers: {
            include: {
              subscriber: true
            }
          }
        }
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async create(data: {
    name: string
    description?: string
    created_by: string
  }): Promise<UserGroup> {
    try {
      return await prisma.userGroup.create({
        data
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async update(id: string, data: Partial<UserGroup>): Promise<UserGroup> {
    try {
      return await prisma.userGroup.update({
        where: { id },
        data
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await prisma.userGroup.delete({
        where: { id }
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async addSubscriber(groupId: string, subscriberId: string): Promise<void> {
    try {
      await prisma.groupSubscriber.create({
        data: {
          group_id: groupId,
          subscriber_id: subscriberId
        }
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async removeSubscriber(groupId: string, subscriberId: string): Promise<void> {
    try {
      await prisma.groupSubscriber.delete({
        where: {
          group_id_subscriber_id: {
            group_id: groupId,
            subscriber_id: subscriberId
          }
        }
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  }
}

// Email template operations
export const emailTemplateService = {
  async getAll(userId: string): Promise<EmailTemplate[]> {
    try {
      return await prisma.emailTemplate.findMany({
        where: { created_by: userId },
        orderBy: { created_at: 'desc' }
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async getById(id: string): Promise<EmailTemplate | null> {
    try {
      return await prisma.emailTemplate.findUnique({
        where: { id }
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async create(data: {
    name: string
    subject: string
    content: string
    template_data?: any
    created_by: string
  }): Promise<EmailTemplate> {
    try {
      return await prisma.emailTemplate.create({
        data
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async update(id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    try {
      return await prisma.emailTemplate.update({
        where: { id },
        data
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await prisma.emailTemplate.delete({
        where: { id }
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  }
}

// WhatsApp template operations
export const whatsappTemplateService = {
  async getAll(userId: string): Promise<WhatsAppTemplate[]> {
    try {
      return await prisma.whatsAppTemplate.findMany({
        where: { created_by: userId },
        orderBy: { created_at: 'desc' }
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async getById(id: string): Promise<WhatsAppTemplate | null> {
    try {
      return await prisma.whatsAppTemplate.findUnique({
        where: { id }
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async create(data: {
    name: string
    content: string
    template_data?: any
    created_by: string
  }): Promise<WhatsAppTemplate> {
    try {
      return await prisma.whatsAppTemplate.create({
        data
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async update(id: string, data: Partial<WhatsAppTemplate>): Promise<WhatsAppTemplate> {
    try {
      return await prisma.whatsAppTemplate.update({
        where: { id },
        data
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await prisma.whatsAppTemplate.delete({
        where: { id }
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  }
}

// Campaign operations
export const campaignService = {
  async getAll(userId: string): Promise<Campaign[]> {
    try {
      return await prisma.campaign.findMany({
        where: { created_by: userId },
        include: {
          email_template: true,
          whatsapp_template: true,
          campaign_groups: {
            include: {
              group: true
            }
          },
          campaign_analytics: true
        },
        orderBy: { created_at: 'desc' }
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async getById(id: string): Promise<Campaign | null> {
    try {
      return await prisma.campaign.findUnique({
        where: { id },
        include: {
          email_template: true,
          whatsapp_template: true,
          campaign_groups: {
            include: {
              group: {
                include: {
                  group_subscribers: {
                    include: {
                      subscriber: true
                    }
                  }
                }
              }
            }
          },
          campaign_analytics: true
        }
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async create(data: {
    name: string
    type: CampaignType
    subject?: string
    template_id: string
    status?: CampaignStatus
    scheduled_at?: Date
    created_by: string
  }): Promise<Campaign> {
    try {
      return await prisma.campaign.create({
        data
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async update(id: string, data: Partial<Campaign>): Promise<Campaign> {
    try {
      return await prisma.campaign.update({
        where: { id },
        data
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await prisma.campaign.delete({
        where: { id }
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async addGroups(campaignId: string, groupIds: string[]): Promise<void> {
    try {
      await prisma.campaignGroup.createMany({
        data: groupIds.map(groupId => ({
          campaign_id: campaignId,
          group_id: groupId
        }))
      })
    } catch (error) {
      throw handlePrismaError(error)
    }
  }
}

// Analytics operations
export const analyticsService = {
  async getCampaignStats(userId: string) {
    try {
      const [totalCampaigns, sentCampaigns, totalSubscribers, activeSubscribers] = await Promise.all([
        prisma.campaign.count({
          where: { created_by: userId }
        }),
        prisma.campaign.count({
          where: { 
            created_by: userId,
            status: 'SENT'
          }
        }),
        prisma.subscriber.count(),
        prisma.subscriber.count({
          where: { status: 'ACTIVE' }
        })
      ])

      return {
        totalCampaigns,
        sentCampaigns,
        totalSubscribers,
        activeSubscribers
      }
    } catch (error) {
      throw handlePrismaError(error)
    }
  },

  async updateCampaignAnalytics(campaignId: string, data: {
    total_sent?: number
    total_delivered?: number
    total_opened?: number
    total_clicked?: number
    total_bounced?: number
    total_unsubscribed?: number
  }) {
    try {
      const analytics = await prisma.campaignAnalytics.upsert({
        where: { campaign_id: campaignId },
        update: {
          ...data,
          open_rate: data.total_opened && data.total_delivered 
            ? (data.total_opened / data.total_delivered) * 100 
            : 0,
          click_rate: data.total_clicked && data.total_delivered 
            ? (data.total_clicked / data.total_delivered) * 100 
            : 0,
          bounce_rate: data.total_bounced && data.total_sent 
            ? (data.total_bounced / data.total_sent) * 100 
            : 0,
          unsubscribe_rate: data.total_unsubscribed && data.total_delivered 
            ? (data.total_unsubscribed / data.total_delivered) * 100 
            : 0
        },
        create: {
          campaign_id: campaignId,
          ...data,
          open_rate: data.total_opened && data.total_delivered 
            ? (data.total_opened / data.total_delivered) * 100 
            : 0,
          click_rate: data.total_clicked && data.total_delivered 
            ? (data.total_clicked / data.total_delivered) * 100 
            : 0,
          bounce_rate: data.total_bounced && data.total_sent 
            ? (data.total_bounced / data.total_sent) * 100 
            : 0,
          unsubscribe_rate: data.total_unsubscribed && data.total_delivered 
            ? (data.total_unsubscribed / data.total_delivered) * 100 
            : 0
        }
      })

      return analytics
    } catch (error) {
      throw handlePrismaError(error)
    }
  }
}