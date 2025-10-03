import { PrismaClient, Channel, ClientStatus, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const client = await prisma.client.upsert({
    where: { name: 'Acme Corp' },
    update: {},
    create: {
      name: 'Acme Corp',
      status: ClientStatus.active,
      hmacSecret: 'client-secret',
      webhooks: {
        create: [
          {
            channel: Channel.email,
            name: 'Marketing',
            url: 'http://localhost:4000/email',
            isDefault: true
          },
          {
            channel: Channel.email,
            name: 'Transactional',
            url: 'http://localhost:4001/email',
            isDefault: false
          },
          {
            channel: Channel.whatsapp,
            name: 'Promotions',
            url: 'http://localhost:4000/whatsapp',
            isDefault: true
          },
          {
            channel: Channel.whatsapp,
            name: 'Alerts',
            url: 'http://localhost:4001/whatsapp',
            isDefault: false
          }
        ]
      }
    }
  });

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      status: UserStatus.active
    },
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      role: UserRole.admin,
      status: UserStatus.active,
      passwordHash,
      client: {
        connect: {
          id: client.id
        }
      }
    }
  });

  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {
      status: UserStatus.active
    },
    create: {
      name: 'Normal User',
      email: 'user@example.com',
      role: UserRole.user,
      status: UserStatus.active,
      passwordHash,
      client: {
        connect: {
          id: client.id
        }
      },
      leads: {
        create: [
          {
            email: 'sara@example.com',
            firstName: 'Sara',
            lastName: 'Kamal',
            tags: ['vip', 'newsletter'],
            customFields: { company: 'Acme' }
          },
          {
            email: 'leo@example.com',
            firstName: 'Leo',
            lastName: 'Nguyen',
            tags: ['newsletter'],
            customFields: { city: 'Cairo' }
          }
        ]
      },
      templates: {
        create: [
          {
            name: 'Welcome Email',
            channel: Channel.email,
            htmlBody: '<html><body><h1>Welcome {{first_name}}</h1><p>Thanks for joining {{custom_fields.company}}</p><a href="{{unsubscribe_url}}">Unsubscribe</a></body></html>',
            placeholders: ['{{first_name}}', '{{custom_fields.company}}', '{{unsubscribe_url}}']
          },
          {
            name: 'Promo WhatsApp',
            channel: Channel.whatsapp,
            whatsappBody: 'Hi {{first_name}}, check our offers in {{custom_fields.city}}! Reply STOP to opt out.',
            placeholders: ['{{first_name}}', '{{custom_fields.city}}']
          }
        ]
      }
    }
  });

  await prisma.systemConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      callbackWebhookIn: 'http://localhost:3000/api/webhooks/callback',
      defaultHmacSecret: 'default-secret',
      rateLimits: { maxSendsPerDay: 1000, maxCsvImportRows: 5000 },
      csvDefaultMapping: { email: 'email', whatsapp_number: 'whatsappNumber' }
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
