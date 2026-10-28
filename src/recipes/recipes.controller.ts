import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Logger,
  Param,
  ParseFloatPipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AuthGuard,
  type Identidad,
  OptionalAuthGuard,
} from '../auth/auth.guard';
import { Usuario } from '../auth/user.decorator';
import { CuerpoPipe, ListaDeIdsPipe, MongoIdPipe } from '../common/pipes';
import { Rpc } from '../messaging/rpc';

interface Autor {
  id: string;
  name: string;
}

interface Comentario {
  id: string;
  userId: string;
}

interface PaginaDeComentarios {
  items: Comentario[];
  total: number;
  limit: number;
  offset: number;
}

const numero = (campo: string) =>
  new ParseFloatPipe({
    exceptionFactory: () =>
      new BadRequestException(`"${campo}" debe ser un número`),
  });

const entero = (campo: string) =>
  new ParseIntPipe({
    optional: true,
    exceptionFactory: () =>
      new BadRequestException(`"${campo}" debe ser un número entero`),
  });

@Controller('recipes')
export class RecipesController {
  private readonly logger = new Logger(RecipesController.name);

  constructor(private readonly rpc: Rpc) {}

  @UseGuards(AuthGuard)
  @Post()
  create(
    @Body(CuerpoPipe) cuerpo: Record<string, unknown>,
    @Usuario() usuario: Identidad,
  ) {
    return this.rpc.recipes.enviar('create_recipe', {
      ...cuerpo,
      userId: usuario.userId,
    });
  }

  @Get()
  findAll() {
    return this.rpc.recipes.enviar('find_all_recipes');
  }

  @UseGuards(AuthGuard)
  @Get('mine')
  mine(@Usuario() usuario: Identidad) {
    return this.rpc.recipes.enviar('find_recipes_by_user', {
      userId: usuario.userId,
    });
  }

  @Get('search/by-ingredients')
  searchByIngredients(
    @Query('ingredients') ingredients?: string,
    @Query('mode') mode?: string,
  ) {
    return this.rpc.recipes.enviar('search_recipes_by_ingredients', {
      ingredients,
      mode,
    });
  }

  @Get('search/calories')
  searchByMaxCalories(@Query('max', numero('max')) max: number) {
    return this.rpc.recipes.enviar('search_recipes_by_max_calories', { max });
  }

  @Get('search/calories-range')
  searchByCaloriesRange(
    @Query('min', numero('min')) min: number,
    @Query('max', numero('max')) max: number,
  ) {
    return this.rpc.recipes.enviar('search_recipes_by_calories_range', {
      min,
      max,
    });
  }

  @Get('search/by-categories')
  searchByCategories(@Query('categories') categories?: string) {
    return this.rpc.recipes.enviar('search_recipes_by_categories', {
      categories,
    });
  }

  @UseGuards(OptionalAuthGuard)
  @Get('stats')
  statsOfMany(
    @Query('ids', ListaDeIdsPipe) ids: string[],
    @Usuario() usuario?: Identidad,
  ) {
    return this.rpc.socials.enviar('get_recipes_stats', {
      recipeIds: ids,
      userId: usuario?.userId,
    });
  }

  @Get(':id')
  findOne(@Param('id', MongoIdPipe) id: string) {
    return this.rpc.recipes.enviar('find_recipe', id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id', MongoIdPipe) id: string,
    @Body(CuerpoPipe) cuerpo: Record<string, unknown>,
    @Usuario() usuario: Identidad,
  ) {
    return this.rpc.recipes.enviar('update_recipe', {
      id,
      userId: usuario.userId,
      dto: cuerpo,
    });
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(
    @Param('id', MongoIdPipe) id: string,
    @Usuario() usuario: Identidad,
  ) {
    const resultado = await this.rpc.recipes.enviar('remove_recipe', {
      id,
      userId: usuario.userId,
    });
    await Promise.all([
      this.rpc.socials.enviar('purge_recipe_social', { recipeId: id }),
      this.rpc.tags.enviar('remove_all_tags_from_recipe', id),
    ]).catch((error: unknown) =>
      this.logger.warn(
        `No se pudo limpiar lo asociado a la receta ${id}: ${String(
          (error as { message?: string })?.message ?? error,
        )}`,
      ),
    );
    return resultado;
  }

  @Get(':id/tags')
  tags(@Param('id', MongoIdPipe) id: string) {
    return this.rpc.tags.enviar('get_recipe_tags', id);
  }

  @UseGuards(AuthGuard)
  @Put(':id/tags')
  async setTags(
    @Param('id', MongoIdPipe) id: string,
    @Body('tagIds') tagIds: unknown,
    @Usuario() usuario: Identidad,
  ) {
    if (!Array.isArray(tagIds)) {
      throw new BadRequestException('"tagIds" debe ser una lista');
    }
    const receta = await this.rpc.recipes.enviar<{ userId: string }>(
      'find_recipe',
      id,
    );
    if (String(receta.userId) !== usuario.userId) {
      throw new ForbiddenException(
        'Solo la persona que creó la receta puede cambiar sus etiquetas',
      );
    }
    await this.rpc.tags.enviar('set_recipe_tags', { recipeId: id, tagIds });
    return this.rpc.tags.enviar('get_recipe_tags', id);
  }

  @UseGuards(OptionalAuthGuard)
  @Get(':id/stats')
  async stats(
    @Param('id', MongoIdPipe) id: string,
    @Usuario() usuario?: Identidad,
  ) {
    const mapa = await this.rpc.socials.enviar<Record<string, unknown>>(
      'get_recipes_stats',
      { recipeIds: [id], userId: usuario?.userId },
    );
    return mapa[id];
  }

  @UseGuards(AuthGuard)
  @Put(':id/reaction')
  async react(
    @Param('id', MongoIdPipe) id: string,
    @Body('type') tipo: unknown,
    @Usuario() usuario: Identidad,
  ) {
    if (tipo !== 'like' && tipo !== 'dislike') {
      throw new BadRequestException('"type" debe ser "like" o "dislike"');
    }
    await this.rpc.recipes.enviar('find_recipe', id);
    return this.rpc.socials.enviar(
      tipo === 'like' ? 'add_like' : 'add_dislike',
      {
        recipeId: id,
        userId: usuario.userId,
      },
    );
  }

  @UseGuards(AuthGuard)
  @Delete(':id/reaction')
  async unreact(
    @Param('id', MongoIdPipe) id: string,
    @Usuario() usuario: Identidad,
  ) {
    const datos = { recipeId: id, userId: usuario.userId };
    await this.rpc.socials.enviar('remove_like', datos);
    return this.rpc.socials.enviar('remove_dislike', datos);
  }

  @Get(':id/comments')
  async comments(
    @Param('id', MongoIdPipe) id: string,
    @Query('limit', entero('limit')) limit?: number,
    @Query('offset', entero('offset')) offset?: number,
  ) {
    const pagina = await this.rpc.socials.enviar<PaginaDeComentarios>(
      'get_comments_by_recipe',
      { recipeId: id, limit, offset },
    );
    return { ...pagina, items: await this.conAutor(pagina.items) };
  }

  @UseGuards(AuthGuard)
  @Post(':id/comments')
  async comment(
    @Param('id', MongoIdPipe) id: string,
    @Body(CuerpoPipe) cuerpo: Record<string, unknown>,
    @Usuario() usuario: Identidad,
  ) {
    await this.rpc.recipes.enviar('find_recipe', id);
    const comentario = await this.rpc.socials.enviar<Comentario>(
      'add_comment',
      {
        ...cuerpo,
        recipeId: id,
        userId: usuario.userId,
      },
    );
    const [conAutor] = await this.conAutor([comentario]);
    return conAutor;
  }

  private async conAutor<T extends Comentario>(comentarios: T[]) {
    const ids = [...new Set(comentarios.map((c) => c.userId))];
    const autores = ids.length
      ? await this.rpc.users.enviar<Autor[]>('find_users_by_ids', { ids })
      : [];
    const porId = new Map(autores.map((a) => [a.id, a.name]));
    return comentarios.map((c) => ({
      ...c,
      author: {
        id: c.userId,
        name: porId.get(c.userId) ?? 'Usuario eliminado',
      },
    }));
  }
}
