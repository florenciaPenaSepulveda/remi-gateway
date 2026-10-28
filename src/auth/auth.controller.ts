import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Rpc } from '../messaging/rpc';

@Controller('auth')
export class AuthController {
  constructor(private readonly rpc: Rpc) {}

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('refresh-token')
  refreshToken(@Body('refreshToken') refreshToken: unknown) {
    if (typeof refreshToken !== 'string' || !refreshToken) {
      throw new BadRequestException('El refresh token es obligatorio');
    }
    return this.rpc.users.enviar('refresh_token', refreshToken);
  }
}
