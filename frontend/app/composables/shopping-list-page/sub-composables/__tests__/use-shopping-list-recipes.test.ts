import { afterEach, describe, expect, test, vi } from "vitest";
import { ref } from "vue";
import type { ShoppingListOut } from "~/lib/api/types/household";
import type { RecipeSummary } from "~/lib/api/types/recipe";
import { useShoppingListRecipes } from "../use-shopping-list-recipes";
import { MOCK_SHOPPING_LIST } from "./mocks";

const addRecipes = vi.fn().mockResolvedValue({ data: true });
const removeRecipe = vi.fn().mockResolvedValue(({ data: true }));

vi.mock("~/composables/api", () => ({
  useUserApi: () => ({
    shopping: { lists: { addRecipes, removeRecipe } },
  }),
}));

describe("use-shopping-list-recipes", () => {
  const list = MOCK_SHOPPING_LIST;
  const shoppingList: Ref<ShoppingListOut | null> = ref(list);
  const loadingCounter = ref(0);
  const recipeReferenceLoading = ref(false);
  const refresh = vi.fn();
  const {
    addRecipeReferenceToList,
    removeRecipeReferenceToList,
    addRecipeDialog,
    selectedRecipe,
    addSelectedRecipe,
  } = useShoppingListRecipes(
    shoppingList,
    loadingCounter,
    recipeReferenceLoading,
    refresh,
  );

  afterEach(() => {
    shoppingList.value = list;
    loadingCounter.value = 0;
    recipeReferenceLoading.value = false;
  });

  describe.for([
    ["adding recipes", addRecipeReferenceToList, addRecipes] as const,
    ["removing recipes", removeRecipeReferenceToList, removeRecipe] as const,
  ])("%s", async ([_, recipeUpdater, mock]) => {
    test("updates tracking values", async () => {
      expect(loadingCounter.value).toBe(0);
      expect(recipeReferenceLoading.value).toBe(false);
      const promise = recipeUpdater("recipe_id");
      expect(loadingCounter.value).toBe(1);
      expect(recipeReferenceLoading.value).toBe(true);
      await promise;
      expect(loadingCounter.value).toBe(0);
      expect(recipeReferenceLoading.value).toBe(false);
      expect(mock).toHaveBeenCalled();
    });
    test("refreshes only on success", async () => {
      refresh.mockClear();
      mock.mockResolvedValueOnce({ data: false });
      await recipeUpdater("recipe_id");
      expect(refresh).not.toHaveBeenCalled();
      await recipeUpdater("recipe_id");
      expect(refresh).toHaveBeenCalled();
    });
    test("only updates if shopping list exists", async () => {
      mock.mockClear();
      shoppingList.value = null;
      await recipeUpdater("recipe_id");
      expect(mock).not.toHaveBeenCalled();
    });
    test("doesn't update if something else is loading", async () => {
      mock.mockClear();
      recipeReferenceLoading.value = true;
      await recipeUpdater("recipe_id");
      expect(mock).not.toHaveBeenCalled();
    });
  });

  describe("adding the selected recipe", () => {
    const recipe = { id: "recipe_id", name: "Recipe" } as RecipeSummary;

    afterEach(() => {
      addRecipeDialog.value = false;
      selectedRecipe.value = null;
    });

    test("adds the selected recipe's ingredients and closes the dialog", async () => {
      addRecipes.mockClear();
      refresh.mockClear();
      addRecipeDialog.value = true;
      selectedRecipe.value = recipe;
      await addSelectedRecipe();
      expect(addRecipes).toHaveBeenCalledWith(list.id, [{ recipeId: "recipe_id" }]);
      expect(refresh).toHaveBeenCalled();
      expect(addRecipeDialog.value).toBe(false);
      expect(selectedRecipe.value).toBeNull();
    });
    test("does nothing when no recipe is selected", async () => {
      addRecipes.mockClear();
      addRecipeDialog.value = true;
      await addSelectedRecipe();
      expect(addRecipes).not.toHaveBeenCalled();
      expect(addRecipeDialog.value).toBe(true);
    });
  });
});
