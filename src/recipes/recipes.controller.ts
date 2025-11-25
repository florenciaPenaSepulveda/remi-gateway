import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User } from 'src/auth/user.decorator';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateRecipeDto, @User() user) {
    console.log('user:', user);
    console.log('userId enviado:', user.userId);

    return this.recipesService.create(dto, user.userId);
  }

  @Get()
  findAll() {
    return this.recipesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  getMyRecipes(@User() user) {
    const userId = user.userId ?? user.id ?? user.sub;
    return this.recipesService.findByUser(userId);
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

  @Get('search/by-categories')
  searchByCategories(@Query('categories') categories: string) {
    return this.recipesService.searchByCategories(categories);
  }
}
