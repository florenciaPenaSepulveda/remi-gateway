import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard, type Identidad } from '../auth/auth.guard';
import { Usuario } from '../auth/user.decorator';
import { CuerpoPipe, MongoIdPipe } from '../common/pipes';
import { Rpc } from '../messaging/rpc';

const LIMITE_ESTRICTO = { default: { limit: 10, ttl: 60000 } };

@Controller('users')
export class UsersController {
  constructor(private readonly rpc: Rpc) {}

  @Throttle(LIMITE_ESTRICTO)
  @Post()
  register(@Body(CuerpoPipe) cuerpo: Record<string, unknown>) {
    return this.rpc.users.enviar('create_user', cuerpo);
  }

  @Throttle(LIMITE_ESTRICTO)
  @Post('login')
  login(@Body(CuerpoPipe) cuerpo: Record<string, unknown>) {
    return this.rpc.users.enviar('login_user', cuerpo);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Usuario() usuario: Identidad) {
    return this.rpc.users.enviar('find_user_by_id', usuario.userId);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async profile(@Param('id', MongoIdPipe) id: string) {
    const { name } = await this.rpc.users.enviar<{ name: string }>(
      'find_user_by_id',
      id,
    );
    return { id, name };
  }
}
