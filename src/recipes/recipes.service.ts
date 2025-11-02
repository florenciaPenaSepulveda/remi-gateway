import { Inject, Injectable } from '@nestjs/common';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RecipesService {
  constructor(
    @Inject('RECIPES_SERVICE') private readonly client: ClientProxy,
  ) {}

  create(createRecipeDto: CreateRecipeDto) {
    return 'This action adds a new recipe';
  }

  findAll() {
    return `This action returns all recipes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} recipe`;
  }

  update(id: number, updateRecipeDto: UpdateRecipeDto) {
    return `This action updates a #${id} recipe`;
  }

  remove(id: number) {
    return `This action removes a #${id} recipe`;
  }

  findAllIngredients() {
    return `This action returns all ingredients`;
  }

  createIngredient(createRecipeDto: CreateRecipeDto) {
    return 'This action adds a new ingredient';
  }
}
