/**
 * Prisma Seed Script
 * Populates the database with sample data for development and testing.
 * Run with: npx prisma db seed
 */

import { PrismaClient, ActionItemStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── 1. Create a demo user ─────────────────────────────────
  const passwordHash = await bcrypt.hash('Demo1234', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      passwordHash,
    },
  });

  console.log(`✅ User created: ${user.email}`);

  // ── 2. Create a sample meeting with transcripts ───────────
  const meeting = await prisma.meeting.create({
    data: {
      title: 'Q2 Product Planning Meeting',
      participants: ['Alice', 'Bob', 'Charlie'],
      meetingDate: new Date('2026-06-10T10:00:00.000Z'),
      createdById: user.id,
      transcripts: {
        create: [
          {
            speaker: 'Alice',
            text: 'Good morning everyone. Let\'s start with the launch plan. We need to ship the new dashboard feature by next Friday.',
            timestamp: '00:01',
            sequence: 0,
          },
          {
            speaker: 'Bob',
            text: 'Agreed. I think we also need to prepare the release notes before the launch. Alice, can you take that?',
            timestamp: '00:05',
            sequence: 1,
          },
          {
            speaker: 'Alice',
            text: 'Sure, I\'ll have the release notes ready by Wednesday.',
            timestamp: '00:07',
            sequence: 2,
          },
          {
            speaker: 'Charlie',
            text: 'I\'ll handle the QA testing and make sure all the critical paths are covered by Thursday.',
            timestamp: '00:10',
            sequence: 3,
          },
          {
            speaker: 'Bob',
            text: 'Great. Let\'s also schedule a pre-launch review meeting for Thursday afternoon at 3 PM.',
            timestamp: '00:15',
            sequence: 4,
          },
          {
            speaker: 'Alice',
            text: 'Perfect. We\'ve decided to go with the blue theme for the new dashboard, as per our earlier design review.',
            timestamp: '00:18',
            sequence: 5,
          },
          {
            speaker: 'Charlie',
            text: 'One more thing — Bob, can you update the API documentation before the release?',
            timestamp: '00:20',
            sequence: 6,
          },
          {
            speaker: 'Bob',
            text: 'Yes, I\'ll get the API docs updated by Wednesday as well.',
            timestamp: '00:22',
            sequence: 7,
          },
        ],
      },
    },
  });

  console.log(`✅ Meeting created: ${meeting.title} (ID: ${meeting.id})`);

  // ── 3. Create sample action items ─────────────────────────
  const actionItems = await Promise.all([
    prisma.actionItem.create({
      data: {
        task: 'Prepare Release Notes',
        assignee: 'Alice',
        dueDate: new Date('2026-06-11T17:00:00.000Z'),
        status: ActionItemStatus.IN_PROGRESS,
        meetingId: meeting.id,
        reminderCount: 0,
      },
    }),
    prisma.actionItem.create({
      data: {
        task: 'Complete QA Testing for Dashboard Feature',
        assignee: 'Charlie',
        dueDate: new Date('2026-06-12T17:00:00.000Z'),
        status: ActionItemStatus.PENDING,
        meetingId: meeting.id,
        reminderCount: 0,
      },
    }),
    prisma.actionItem.create({
      data: {
        task: 'Update API Documentation',
        assignee: 'Bob',
        dueDate: new Date('2026-06-11T17:00:00.000Z'),
        status: ActionItemStatus.PENDING,
        meetingId: meeting.id,
        reminderCount: 0,
      },
    }),
    // An intentionally overdue item for testing
    prisma.actionItem.create({
      data: {
        task: 'Review Design Mockups (OVERDUE EXAMPLE)',
        assignee: 'Alice',
        dueDate: new Date('2026-05-25T17:00:00.000Z'), // Past date
        status: ActionItemStatus.PENDING,
        meetingId: meeting.id,
        reminderCount: 2,
      },
    }),
  ]);

  console.log(`✅ Created ${actionItems.length} action items`);
  console.log('\n🎉 Seed complete!');
  console.log('\n📝 Demo credentials:');
  console.log('   Email: demo@example.com');
  console.log('   Password: Demo1234');
  console.log(`\n📅 Sample meeting ID: ${meeting.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
