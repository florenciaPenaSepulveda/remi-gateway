export class CreateIngredientDto {
  readonly name: string;
  readonly unit?: string;
  readonly caloriesPerUnit?: number;
}
