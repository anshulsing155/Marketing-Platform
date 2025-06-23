import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create sample profiles (these would normally be created via Supabase Auth)
  const sampleProfile = await prisma.profile.upsert({
    where: { email: 'admin@mailflow.com' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@mailflow.com',
      full_name: 'Admin User',
      role: 'ADMIN'
    }
  })

  console.log('✅ Created sample profile:', sampleProfile.email)

  // Create sample subscribers
  const subscribers = await Promise.all([
    prisma.subscriber.upsert({
      where: { email: 'john.doe@example.com' },
      update: {},
      create: {
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567890',
        status: 'ACTIVE',
        whatsapp_opt_in: true
      }
    }),
    prisma.subscriber.upsert({
      where: { email: 'jane.smith@example.com' },
      update: {},
      create: {
        email: 'jane.smith@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '+1234567891',
        status: 'ACTIVE',
        whatsapp_opt_in: false
      }
    }),
    prisma.subscriber.upsert({
      where: { email: 'bob.wilson@example.com' },
      update: {},
      create: {
        email: 'bob.wilson@example.com',
        first_name: 'Bob',
        last_name: 'Wilson',
        status: 'ACTIVE',
        whatsapp_opt_in: true
      }
    })
  ])

  console.log('✅ Created sample subscribers:', subscribers.length)

  // Create sample groups
  const newsletterGroup = await prisma.userGroup.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Newsletter Subscribers',
      description: 'Users who subscribed to our weekly newsletter',
      created_by: sampleProfile.id
    }
  })

  const vipGroup = await prisma.userGroup.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'VIP Customers',
      description: 'Our most valued customers',
      created_by: sampleProfile.id
    }
  })

  console.log('✅ Created sample groups:', [newsletterGroup.name, vipGroup.name])

  // Add subscribers to groups
  await Promise.all([
    prisma.groupSubscriber.upsert({
      where: {
        group_id_subscriber_id: {
          group_id: newsletterGroup.id,
          subscriber_id: subscribers[0].id
        }
      },
      update: {},
      create: {
        group_id: newsletterGroup.id,
        subscriber_id: subscribers[0].id
      }
    }),
    prisma.groupSubscriber.upsert({
      where: {
        group_id_subscriber_id: {
          group_id: newsletterGroup.id,
          subscriber_id: subscribers[1].id
        }
      },
      update: {},
      create: {
        group_id: newsletterGroup.id,
        subscriber_id: subscribers[1].id
      }
    }),
    prisma.groupSubscriber.upsert({
      where: {
        group_id_subscriber_id: {
          group_id: vipGroup.id,
          subscriber_id: subscribers[0].id
        }
      },
      update: {},
      create: {
        group_id: vipGroup.id,
        subscriber_id: subscribers[0].id
      }
    })
  ])

  console.log('✅ Added subscribers to groups')

  // Create sample email templates
  const emailTemplate = await prisma.emailTemplate.create({
    data: {
      name: 'Welcome Email',
      subject: 'Welcome to MailFlow!',
      content: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome aboard!</h1>
          </div>
          <div style="padding: 40px 20px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi there!</h2>
            <p style="color: #666; line-height: 1.6;">
              We're thrilled to have you join our community. Get ready for exclusive content, 
              updates, and special offers delivered right to your inbox.
            </p>
          </div>
        </div>
      `,
      created_by: sampleProfile.id
    }
  })

  // Create sample WhatsApp template
  const whatsappTemplate = await prisma.whatsAppTemplate.create({
    data: {
      name: 'Welcome Message',
      content: `🎉 Welcome to MailFlow!

Hi {{name}}, 

Thank you for joining us! We're excited to have you on board.

You'll receive updates about:
✅ New products & services
✅ Exclusive offers
✅ Important announcements

Reply STOP to unsubscribe anytime.

Best regards,
Team MailFlow`,
      created_by: sampleProfile.id
    }
  })

  console.log('✅ Created sample templates:', [emailTemplate.name, whatsappTemplate.name])

  console.log('🎉 Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })