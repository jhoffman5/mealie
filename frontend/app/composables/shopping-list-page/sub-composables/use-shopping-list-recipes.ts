import type { ShoppingListOut } from "~/lib/api/types/household";
import type { RecipeSummary } from "~/lib/api/types/recipe";
import { useUserApi } from "~/composables/api";

/**
 * Composable for managing shopping list recipe references
 */
export function useShoppingListRecipes(
  shoppingList: Ref<ShoppingListOut | null>,
  loadingCounter: Ref<number>,
  recipeReferenceLoading: Ref<boolean>,
  refresh: () => void,
) {
  const userApi = useUserApi();

  const addRecipeDialog = ref(false);
  const selectedRecipe = ref<RecipeSummary | null>(null);

  async function addRecipeReferenceToList(recipeId: string) {
    if (!shoppingList.value || recipeReferenceLoading.value) {
      return;
    }

    loadingCounter.value += 1;
    recipeReferenceLoading.value = true;
    const { data } = await userApi.shopping.lists.addRecipes(shoppingList.value.id, [{ recipeId }]);
    recipeReferenceLoading.value = false;
    loadingCounter.value -= 1;

    if (data) {
      refresh();
    }
  }

  async function removeRecipeReferenceToList(recipeId: string) {
    if (!shoppingList.value || recipeReferenceLoading.value) {
      return;
    }

    loadingCounter.value += 1;
    recipeReferenceLoading.value = true;
    const { data } = await userApi.shopping.lists.removeRecipe(shoppingList.value.id, recipeId);
    recipeReferenceLoading.value = false;
    loadingCounter.value -= 1;

    if (data) {
      refresh();
    }
  }

  async function addSelectedRecipe() {
    const recipeId = selectedRecipe.value?.id;
    if (!recipeId) {
      return;
    }

    await addRecipeReferenceToList(recipeId);
    addRecipeDialog.value = false;
    selectedRecipe.value = null;
  }

  return {
    addRecipeDialog,
    selectedRecipe,
    addSelectedRecipe,
    addRecipeReferenceToList,
    removeRecipeReferenceToList,
  };
}
