export class CreateIngredientDto {
  readonly name: string;
  readonly tags?: string[];
  readonly category?: string;
  readonly unit?: string;
  readonly caloriesPerUnit?: number;
}
