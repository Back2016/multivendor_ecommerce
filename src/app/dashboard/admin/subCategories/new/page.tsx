import SubCategoryDetails from "@/components/dashboard/forms/subCategory-details";
import { getAllCategories } from "@/queries/category";

export default async function AdminNewSubCategoriesPage() {
    const categories = await getAllCategories();
  return (
    <SubCategoryDetails categories={categories}/>
  )
}
