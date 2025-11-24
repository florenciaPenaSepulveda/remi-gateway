import { Inject, Injectable } from '@nestjs/common';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RecipesService {
  constructor(
    @Inject('RECIPES_SERVICE') private readonly client: ClientProxy,
  ) {}

  async create(createRecipeDto: CreateRecipeDto) {
    return await firstValueFrom(
      this.client.send({ cmd: 'create_recipe' }, createRecipeDto),
    );
  }

  async findAll() {
    return await firstValueFrom(
      this.client.send({ cmd: 'get_all_recipes' }, {}),
    );
  }

  async findOne(id: string) {
    return await firstValueFrom(
      this.client.send({ cmd: 'find_recipe_by_id' }, id),
    );
  }

  async update(id: string, updateRecipeDto: UpdateRecipeDto) {
    return await firstValueFrom(
      this.client.send({ cmd: 'update_recipe' }, { id, ...updateRecipeDto }),
    );
  }

  async remove(id: string) {
    return await firstValueFrom(
      this.client.send({ cmd: 'remove_recipe' }, id),
    );
  }
}