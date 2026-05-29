import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  if (process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production') {
    console.log('Production environment detected. Skipping database seeding.');
    return;
  }

  // Clear tables
  await prisma.metric.deleteMany({});
  await prisma.publication.deleteMany({});
  await prisma.event.deleteMany({});

  console.log('Cleared database tables.');

  // Create Campaign Events
  const events = [
    { name: 'LexiTech - VPN', type: 'Externe', dateM: new Date('2026-05-10'), dateM1: new Date('2026-04-10') },
    { name: 'États gén. Postes & Télécom.', type: 'Externe', dateM: new Date('2026-05-15'), dateM1: new Date('2026-04-15') },
    { name: 'Semaine française à Kinshasa', type: 'Interne', dateM: new Date('2026-05-20'), dateM1: new Date('2026-04-20') },
    { name: 'Lancement Cloud National', type: 'Externe', dateM: new Date('2026-05-05'), dateM1: new Date('2026-04-05') },
    { name: 'Séminaire Cybersécurité RDC', type: 'Interne', dateM: new Date('2026-05-25'), dateM1: new Date('2026-04-22') }
  ];

  for (const ev of events) {
    // 1. Current Month Event
    const eventM = await prisma.event.create({
      data: {
        name: ev.name,
        type: ev.type,
        createdAt: ev.dateM,
      }
    });

    // Publications for Current Month (M)
    const pubM1 = await prisma.publication.create({
      data: {
        eventId: eventM.id,
        platform: 'LinkedIn',
        publishedAt: ev.dateM,
        leadTimeDays: parseFloat((Math.random() * 4 + 2).toFixed(1)), // 2 to 6 days
      }
    });

    const pubM2 = await prisma.publication.create({
      data: {
        eventId: eventM.id,
        platform: 'Facebook',
        publishedAt: new Date(ev.dateM.getTime() + 24 * 60 * 60 * 1000), // Day after
        leadTimeDays: parseFloat((Math.random() * 3 + 1).toFixed(1)),
      }
    });

    // Add metrics for current month
    // We will add daily snapshots of interactions for 5 days after publishing
    for (let i = 0; i < 5; i++) {
      await prisma.metric.create({
        data: {
          publicationId: pubM1.id,
          interactions: Math.floor(Math.random() * 150 + 50),
          recordedAt: new Date(pubM1.publishedAt.getTime() + i * 24 * 60 * 60 * 1000),
        }
      });
      await prisma.metric.create({
        data: {
          publicationId: pubM2.id,
          interactions: Math.floor(Math.random() * 120 + 30),
          recordedAt: new Date(pubM2.publishedAt.getTime() + i * 24 * 60 * 60 * 1000),
        }
      });
    }

    // 2. Previous Month Event (M-1)
    const eventM1 = await prisma.event.create({
      data: {
        name: ev.name,
        type: ev.type,
        createdAt: ev.dateM1,
      }
    });

    // Publications for M-1
    const pubM1_1 = await prisma.publication.create({
      data: {
        eventId: eventM1.id,
        platform: 'LinkedIn',
        publishedAt: ev.dateM1,
        leadTimeDays: parseFloat((Math.random() * 5 + 3).toFixed(1)),
      }
    });

    const pubM1_2 = await prisma.publication.create({
      data: {
        eventId: eventM1.id,
        platform: 'Facebook',
        publishedAt: new Date(ev.dateM1.getTime() + 24 * 60 * 60 * 1000),
        leadTimeDays: parseFloat((Math.random() * 3 + 1).toFixed(1)),
      }
    });

    // Add metrics for previous month (typically slightly lower)
    for (let i = 0; i < 5; i++) {
      await prisma.metric.create({
        data: {
          publicationId: pubM1_1.id,
          interactions: Math.floor(Math.random() * 100 + 40),
          recordedAt: new Date(pubM1_1.publishedAt.getTime() + i * 24 * 60 * 60 * 1000),
        }
      });
      await prisma.metric.create({
        data: {
          publicationId: pubM1_2.id,
          interactions: Math.floor(Math.random() * 90 + 20),
          recordedAt: new Date(pubM1_2.publishedAt.getTime() + i * 24 * 60 * 60 * 1000),
        }
      });
    }
  }

  console.log('Successfully seeded database with events, publications, and metrics.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
