import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class IngredientEntryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsOptional()
  @IsString()
  unit?: string;
}
export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @IsNumber()
  servings: number;

  @IsString()
  @IsNotEmpty()
  instructions: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  calories?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientEntryDto)
  ingredients: IngredientEntryDto[];
}
