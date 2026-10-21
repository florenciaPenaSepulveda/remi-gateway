import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';

@Injectable()
export class IngredientsService {
  constructor(
    @Inject('RECIPES_SERVICE') private readonly client: ClientProxy,
  ) {}

  // 🔹 Crear
  async create(dto: CreateIngredientDto) {
    return firstValueFrom(this.client.send({ cmd: 'create_ingredient' }, dto));
  }

  // 🔹 Obtener todos
  async findAll() {
    return firstValueFrom(
      this.client.send({ cmd: 'find_all_ingredients' }, {}),
    );
  }

  // 🔹 Obtener uno
  async findOne(id: string) {
    return firstValueFrom(this.client.send({ cmd: 'find_ingredient' }, id));
  }

  // 🔹 Actualizar
  async update(id: string, dto: UpdateIngredientDto) {
    return firstValueFrom(
      this.client.send({ cmd: 'update_ingredient' }, { id, dto }),
    );
  }

  // 🔹 Eliminar
  async remove(id: string) {
    return firstValueFrom(this.client.send({ cmd: 'remove_ingredient' }, id));
  }

  // 🔹 Llenar la BD
  async populate(list: CreateIngredientDto[]) {
    return firstValueFrom(
      this.client.send({ cmd: 'populate_ingredients' }, list),
    );
  }
}
