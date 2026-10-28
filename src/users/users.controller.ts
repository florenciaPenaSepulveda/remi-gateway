import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard, type Identidad } from '../auth/auth.guard';
import { Usuario } from '../auth/user.decorator';
import { CuerpoPipe, MongoIdPipe } from '../common/pipes';
import { Rpc } from '../messaging/rpc';
import { conAutores, nivelDeCreador } from '../recipes/autores';

const LIMITE_ESTRICTO = { default: { limit: 10, ttl: 60000 } };

interface EstadisticasDeCreador {
  average: number;
  ratings: number;
  cookedByOthers: number;
}

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
  async me(@Usuario() usuario: Identidad) {
    const [perfil, estadisticas] = await Promise.all([
      this.rpc.users.enviar<Record<string, unknown>>(
        'find_user_by_id',
        usuario.userId,
      ),
      this.rpc.socials.enviar('get_user_stats', { userId: usuario.userId }),
    ]);
    return { ...perfil, stats: estadisticas };
  }

  @Get(':id/profile')
  async profile(@Param('id', MongoIdPipe) id: string) {
    const [usuario, recetas, estadisticas] = await Promise.all([
      this.rpc.users.enviar<{ name: string }>('find_user_by_id', id),
      this.rpc.recipes.enviar<Array<{ userId: string }>>(
        'find_recipes_by_user',
        { userId: id },
      ),
      this.rpc.socials.enviar<Record<string, EstadisticasDeCreador>>(
        'get_creators_stats',
        { userIds: [id] },
      ),
    ]);
    const { average, ratings, cookedByOthers } = estadisticas[id];
    return {
      id,
      name: usuario.name,
      level: nivelDeCreador(cookedByOthers),
      recipesCount: recetas.length,
      average,
      ratings,
      cookedByOthers,
      recipes: await conAutores(this.rpc, recetas),
    };
  }
}
