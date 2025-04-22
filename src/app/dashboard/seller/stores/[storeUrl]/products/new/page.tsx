import ProductDetails from "@/components/dashboard/forms/product-details";
import { getAllCategories } from "@/queries/category";
import { getAllOfferTags } from "@/queries/offer-tag";

export default async function SellerNewProductsPage({ params }: { params: { storeUrl: string } }) {
    const paramsObj = await params;
    const categories = await getAllCategories();
    const offerTags = await getAllOfferTags();

    return (
        <div className="w-full"><ProductDetails offerTags={offerTags} categories={categories} storeUrl={paramsObj.storeUrl} /></div>
    )
}
