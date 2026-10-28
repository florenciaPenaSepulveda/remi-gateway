import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CuerpoPipe, MongoIdPipe } from '../common/pipes';
import { Rpc } from '../messaging/rpc';

@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly rpc: Rpc) {}

  @Get()
  findAll() {
    return this.rpc.recipes.enviar('find_all_ingredients');
  }

  @UseGuards(AuthGuard)
  @Post('populate')
  populate(@Body() lista: unknown) {
    if (!Array.isArray(lista)) {
      throw new BadRequestException('Envía una lista de ingredientes');
    }
    return this.rpc.recipes.enviar('populate_ingredients', { items: lista });
  }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body(CuerpoPipe) cuerpo: Record<string, unknown>) {
    return this.rpc.recipes.enviar('create_ingredient', cuerpo);
  }

  @Get(':id')
  findOne(@Param('id', MongoIdPipe) id: string) {
    return this.rpc.recipes.enviar('find_ingredient', id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id', MongoIdPipe) id: string,
    @Body(CuerpoPipe) cuerpo: Record<string, unknown>,
  ) {
    return this.rpc.recipes.enviar('update_ingredient', { id, dto: cuerpo });
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id', MongoIdPipe) id: string) {
    return this.rpc.recipes.enviar('remove_ingredient', id);
  }
}
