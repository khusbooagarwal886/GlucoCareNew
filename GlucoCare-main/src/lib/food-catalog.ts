export type FoodCatalogItem = {
  id: string;
  name: string;
  portion: string;
  calories: number;
  carbs: number;
  barcode?: string;
};

export const FOOD_CATALOG: FoodCatalogItem[] = [
  { id: "idli", name: "Idli", portion: "2 pieces", calories: 120, carbs: 24 },
  { id: "dosa", name: "Plain dosa", portion: "1 medium", calories: 170, carbs: 24 },
  { id: "poha", name: "Poha", portion: "1 bowl", calories: 210, carbs: 32 },
  { id: "upma", name: "Upma", portion: "1 bowl", calories: 220, carbs: 30 },
  { id: "oats", name: "Oats porridge", portion: "1 bowl", calories: 180, carbs: 27, barcode: "8901234567001" },
  { id: "apple", name: "Apple", portion: "1 medium", calories: 95, carbs: 25 },
  { id: "banana", name: "Banana", portion: "1 medium", calories: 105, carbs: 27 },
  { id: "milk", name: "Low-fat milk", portion: "1 glass", calories: 100, carbs: 12, barcode: "8901234567002" },
  { id: "roti", name: "Roti", portion: "2 pieces", calories: 200, carbs: 36 },
  { id: "brown-rice", name: "Brown rice", portion: "1 cup", calories: 215, carbs: 45 },
  { id: "dal", name: "Dal", portion: "1 bowl", calories: 140, carbs: 18 },
  { id: "rajma", name: "Rajma", portion: "1 bowl", calories: 210, carbs: 30 },
  { id: "paneer", name: "Paneer curry", portion: "1 bowl", calories: 260, carbs: 10 },
  { id: "veg-curry", name: "Mixed vegetable curry", portion: "1 bowl", calories: 150, carbs: 16 },
  { id: "salad", name: "Vegetable salad", portion: "1 plate", calories: 80, carbs: 10 },
  { id: "curd", name: "Curd", portion: "1 bowl", calories: 98, carbs: 7, barcode: "8901234567003" },
  { id: "buttermilk", name: "Buttermilk", portion: "1 glass", calories: 40, carbs: 5, barcode: "8901234567004" },
  { id: "egg", name: "Boiled egg", portion: "2 eggs", calories: 156, carbs: 2 },
  { id: "grilled-chicken", name: "Grilled chicken", portion: "100 g", calories: 165, carbs: 0 },
  { id: "fish-curry", name: "Fish curry", portion: "1 serving", calories: 220, carbs: 6 },
  { id: "sprouts", name: "Sprouts salad", portion: "1 bowl", calories: 120, carbs: 18 },
  { id: "tea", name: "Tea without sugar", portion: "1 cup", calories: 20, carbs: 3, barcode: "8901234567005" },
  { id: "coffee", name: "Coffee without sugar", portion: "1 cup", calories: 15, carbs: 2, barcode: "8901234567006" },
  { id: "nuts", name: "Mixed nuts", portion: "30 g", calories: 180, carbs: 8, barcode: "8901234567007" },
  { id: "protein-bar", name: "Diabetic protein bar", portion: "1 bar", calories: 190, carbs: 16, barcode: "8901234567008" },
  { id: "multigrain-biscuits", name: "Multigrain biscuits", portion: "4 biscuits", calories: 140, carbs: 20, barcode: "8901234567009" },
];

export function searchFoodCatalog(query: string): FoodCatalogItem[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return FOOD_CATALOG.slice(0, 8);
  return FOOD_CATALOG.filter((item) => {
    const haystack = `${item.name} ${item.portion} ${item.barcode ?? ""}`.toLowerCase();
    return haystack.includes(trimmed);
  }).slice(0, 8);
}

export function lookupFoodByBarcode(barcode: string): FoodCatalogItem | null {
  const normalized = barcode.trim();
  if (!normalized) return null;
  return FOOD_CATALOG.find((item) => item.barcode === normalized) ?? null;
}
