import ProductDetails from "@/components/dashboard/forms/product-details";
import { getAllCategories } from "@/queries/category";

export default async function SellerNewProductsPage({ params }: { params: { storeUrl: string } }) {
    const paramsObj = await params;
    const categories = await getAllCategories();

    return (
        <div className="w-full"><ProductDetails categories={categories} storeUrl={paramsObj.storeUrl}/></div>
    )
}
