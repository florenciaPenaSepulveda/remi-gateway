import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  create(@Body() dto: CreateRecipeDto) {
    return this.recipesService.create(dto);
  }

  @Get()
  findAll() {
    return this.recipesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recipesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRecipeDto) {
    return this.recipesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recipesService.remove(id);
  }

  // ----------------------------------------------------------
  // 🔍 Buscar recetas por ingredientes (ALL o ANY)
  // ----------------------------------------------------------
  @Get('search/by-ingredients')
  searchByIngredients(
    @Query('ingredients') ingredients: string,
    @Query('mode') mode: 'all' | 'any' = 'all',
  ) {
    return this.recipesService.searchByIngredients(ingredients, mode);
  }

  // ----------------------------------------------------------
  // 🔍 Buscar por calorías máximas
  // ----------------------------------------------------------
  @Get('search/calories')
  searchByMax(@Query('max') max: number) {
    return this.recipesService.searchByMaxCalories(Number(max));
  }

  // ----------------------------------------------------------
  // 🔍 Buscar por rango de calorías
  // ----------------------------------------------------------
  @Get('search/calories-range')
  searchByRange(@Query('min') min: number, @Query('max') max: number) {
    return this.recipesService.searchByCaloriesRange(Number(min), Number(max));
  }
}
