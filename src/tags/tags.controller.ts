import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CuerpoPipe, ListaDeIdsPipe } from '../common/pipes';
import { Rpc } from '../messaging/rpc';
import { conAutores } from '../recipes/autores';

@Controller('tags')
export class TagsController {
  constructor(private readonly rpc: Rpc) {}

  @Get()
  findAll() {
    return this.rpc.tags.enviar('get_all_tags');
  }

  @Get('search')
  search(@Query('name') name?: string) {
    if (!name?.trim()) {
      throw new BadRequestException('Indica el texto a buscar en "name"');
    }
    return this.rpc.tags.enviar('find_tags_by_name', { name });
  }

  @Get('by-recipes')
  byRecipes(@Query('ids', ListaDeIdsPipe) ids: string[]) {
    return this.rpc.tags.enviar('get_tags_of_recipes', { recipeIds: ids });
  }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body(CuerpoPipe) cuerpo: Record<string, unknown>) {
    return this.rpc.tags.enviar('create_tag', cuerpo);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rpc.tags.enviar('find_tag_by_id', id);
  }

  @Get(':id/recipes')
  async recipes(@Param('id', ParseUUIDPipe) id: string) {
    const ids = await this.rpc.tags.enviar<string[]>('get_recipes_by_tag', id);
    const recetas = await this.rpc.recipes.enviar<Array<{ userId: string }>>(
      'find_recipes_by_ids',
      { ids },
    );
    return conAutores(this.rpc, recetas);
  }
}
