import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  BadRequestException,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type Identidad } from '../auth/auth.guard';
import { Usuario } from '../auth/user.decorator';
import { CuerpoPipe, MongoIdPipe } from '../common/pipes';
import { Rpc } from '../messaging/rpc';
import { conAutores } from '../recipes/autores';

interface Lista {
  id: string;
  recipeIds: string[];
}

interface Receta {
  _id: string;
  userId: string;
}

interface Cocinada {
  recipeId: string;
}

const entero = (campo: string) =>
  new ParseIntPipe({
    optional: true,
    exceptionFactory: () =>
      new BadRequestException(`"${campo}" debe ser un número entero`),
  });

@UseGuards(AuthGuard)
@Controller('cookbook')
export class CookbookController {
  constructor(private readonly rpc: Rpc) {}

  @Get('lists')
  lists(@Usuario() usuario: Identidad) {
    return this.rpc.socials.enviar('get_lists', { userId: usuario.userId });
  }

  @Post('lists')
  createList(
    @Body(CuerpoPipe) cuerpo: Record<string, unknown>,
    @Usuario() usuario: Identidad,
  ) {
    return this.rpc.socials.enviar('create_list', {
      name: cuerpo.name,
      userId: usuario.userId,
    });
  }

  @Get('lists/:id')
  async list(
    @Param('id', ParseUUIDPipe) id: string,
    @Usuario() usuario: Identidad,
  ) {
    const lista = await this.rpc.socials.enviar<Lista>('get_list', {
      userId: usuario.userId,
      listId: id,
    });
    const recetas = lista.recipeIds.length
      ? await this.rpc.recipes.enviar<Receta[]>('find_recipes_by_ids', {
          ids: lista.recipeIds,
        })
      : [];
    const porId = new Map(recetas.map((r) => [String(r._id), r]));
    const ordenadas = lista.recipeIds.flatMap((recipeId) =>
      porId.has(recipeId) ? [porId.get(recipeId) as Receta] : [],
    );
    return { ...lista, recipes: await conAutores(this.rpc, ordenadas) };
  }

  @Patch('lists/:id')
  renameList(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(CuerpoPipe) cuerpo: Record<string, unknown>,
    @Usuario() usuario: Identidad,
  ) {
    return this.rpc.socials.enviar('rename_list', {
      name: cuerpo.name,
      userId: usuario.userId,
      listId: id,
    });
  }

  @Delete('lists/:id')
  deleteList(
    @Param('id', ParseUUIDPipe) id: string,
    @Usuario() usuario: Identidad,
  ) {
    return this.rpc.socials.enviar('delete_list', {
      userId: usuario.userId,
      listId: id,
    });
  }

  @Put('lists/:id/recipes/:recipeId')
  async addRecipe(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('recipeId', MongoIdPipe) recipeId: string,
    @Usuario() usuario: Identidad,
  ) {
    await this.rpc.recipes.enviar('find_recipe', recipeId);
    return this.rpc.socials.enviar('add_to_list', {
      userId: usuario.userId,
      listId: id,
      recipeId,
    });
  }

  @Delete('lists/:id/recipes/:recipeId')
  removeRecipe(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('recipeId', MongoIdPipe) recipeId: string,
    @Usuario() usuario: Identidad,
  ) {
    return this.rpc.socials.enviar('remove_from_list', {
      userId: usuario.userId,
      listId: id,
      recipeId,
    });
  }

  @Get('cooked')
  async cooked(
    @Usuario() usuario: Identidad,
    @Query('limit', entero('limit')) limit?: number,
    @Query('offset', entero('offset')) offset?: number,
  ) {
    const pagina = await this.rpc.socials.enviar<{
      items: Cocinada[];
      total: number;
    }>('get_cooked_history', { userId: usuario.userId, limit, offset });
    const ids = [...new Set(pagina.items.map((c) => c.recipeId))];
    const recetas = ids.length
      ? await this.rpc.recipes.enviar<Receta[]>('find_recipes_by_ids', { ids })
      : [];
    const porId = new Map(recetas.map((r) => [String(r._id), r]));
    return {
      ...pagina,
      items: pagina.items.map((c) => ({
        ...c,
        recipe: porId.get(c.recipeId) ?? null,
      })),
    };
  }
}
