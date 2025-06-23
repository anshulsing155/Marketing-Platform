import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper function to handle Prisma errors
export function handlePrismaError(error: any) {
  if (error.code === 'P2002') {
    return new Error('A record with this information already exists')
  }
  if (error.code === 'P2025') {
    return new Error('Record not found')
  }
  if (error.code === 'P2003') {
    return new Error('Foreign key constraint failed')
  }
  return new Error(error.message || 'Database operation failed')
}

// Type exports for better TypeScript support
export type {
  Profile,
  Subscriber,
  UserGroup,
  GroupSubscriber,
  EmailTemplate,
  WhatsAppTemplate,
  Campaign,
  CampaignGroup,
  CampaignAnalytics,
  SubscriberActivity,
  Role,
  SubscriberStatus,
  CampaignType,
  CampaignStatus,
  ActivityType
} from '@prisma/client'