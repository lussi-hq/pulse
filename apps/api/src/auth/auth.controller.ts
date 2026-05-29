import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { signToken } from './auth.utils';
import * as crypto from 'crypto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    const { username, password } = body;
    if (!username || !password) {
      throw new UnauthorizedException('Username and password are required');
    }

    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    if (user.password !== hashedPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = signToken(user.username);
    return { token, username: user.username };
  }
}
