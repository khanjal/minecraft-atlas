import { Ingredient } from './ingredient.model';

export interface Recipe {
    id: string;
    type: string;
    group?: string;
    result: { id: string; count: number } | null;
    pattern?: string[];
    ingredients: Ingredient[];
}
