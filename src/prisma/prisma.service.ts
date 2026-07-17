import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private configService: ConfigService) {
    super();
  }

  async onModuleInit() {
    await this.$connect();

    const adminEmail = this.configService.get<string>('DEFAULT_ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('DEFAULT_ADMIN_PASSWORD');

    if (adminEmail && adminPassword) {
      const existingAdmin = await this.user.findUnique({
        where: { email: adminEmail },
      });

      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await this.user.create({
          data: {
            email: adminEmail,
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN',
          },
        });
        console.log(`Admin user seeded with email: ${adminEmail}`);
      }
    }
  }
}
