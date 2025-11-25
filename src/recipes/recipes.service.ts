import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@Injectable()
export class RecipesService {
  constructor(
    @Inject('RECIPES_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  // 🟢 Crear receta
  async create(dto: CreateRecipeDto, userId: string) {
    return firstValueFrom(
      this.client.send({ cmd: 'create_recipe' }, { ...dto, userId }),
    );
  }

  // 🔍 Obtener todas las recetas
  async findAll() {
    return firstValueFrom(this.client.send({ cmd: 'find_all_recipes' }, {}));
  }

  // 🔍 Buscar por ID
  async findOne(id: string) {
    return firstValueFrom(this.client.send({ cmd: 'find_recipe' }, id));
  }

  // ✏️ Actualizar
  async update(id: string, dto: UpdateRecipeDto) {
    return firstValueFrom(
      this.client.send({ cmd: 'update_recipe' }, { id, dto }),
    );
  }

  // 🗑️ Eliminar
  async remove(id: string) {
    return firstValueFrom(this.client.send({ cmd: 'remove_recipe' }, id));
  }

  // 🔎 Buscar recetas por ingredientes
  async searchByIngredients(ingredients: string, mode: 'all' | 'any') {
    return firstValueFrom(
      this.client.send(
        { cmd: 'search_recipes_by_ingredients' },
        { ingredients, mode },
      ),
    );
  }

  // 🔎 Buscar por calorías máximas
  async searchByMaxCalories(max: number) {
    return firstValueFrom(
      this.client.send({ cmd: 'search_recipes_by_max_calories' }, max),
    );
  }

  // 🔎 Buscar por rango de calorías
  async searchByCaloriesRange(min: number, max: number) {
    return firstValueFrom(
      this.client.send(
        { cmd: 'search_recipes_by_calories_range' },
        { min, max },
      ),
    );
  }

  async findByUser(userId: string) {
    return firstValueFrom(
      this.client.send({ cmd: 'find_recipes_by_user' }, { userId }),
    );
  }

  async searchByCategories(categories: string) {
    return firstValueFrom(
      this.client.send({ cmd: 'search_recipes_by_categories' }, { categories }),
    );
  }
}
