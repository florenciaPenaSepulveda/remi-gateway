import { Controller, Get } from '@nestjs/common';
import { Rpc } from '../messaging/rpc';

interface Impacto {
  cooked: number;
  pantryCooked: number;
  grams: number;
}

@Controller('impact')
export class ImpactController {
  constructor(private readonly rpc: Rpc) {}

  @Get()
  async impact() {
    const [impacto, miembros, recetas] = await Promise.all([
      this.rpc.socials.enviar<Impacto>('get_impact'),
      this.rpc.users.enviar<number>('count_users'),
      this.rpc.recipes.enviar<number>('count_recipes'),
    ]);
    return {
      cooked: impacto.cooked,
      pantryCooked: impacto.pantryCooked,
      kilos: Math.round(impacto.grams / 100) / 10,
      members: miembros,
      recipes: recetas,
    };
  }
}
