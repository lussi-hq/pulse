const { PrismaClient } = require('@pulse/database');
const crypto = require('crypto');

async function main() {
  const prisma = new PrismaClient();
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const username = process.env.ADMIN_USERNAME;
      const password = process.env.ADMIN_PASSWORD;
      if (!username || !password) {
        console.log('[Pulse Provisioning] Required environment variables for admin setup are not fully set. Skipping admin creation.');
        return;
      }
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
        },
      });
      console.log(`[Pulse Provisioning] Admin user "${username}" successfully created!`);
    } else {
      console.log('[Pulse Provisioning] Admin user already exists. Skipping creation.');
    }
  } catch (err) {
    console.error('[Pulse Provisioning] Error creating admin user:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
