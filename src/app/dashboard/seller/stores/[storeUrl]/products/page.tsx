// Queries
import { getAllStoreProducts } from "@/queries/product";
import DataTable from "@/components/ui/data-table";
import { columns } from "./columns";
import { Plus } from "lucide-react";
import ProductDetails from "@/components/dashboard/forms/product-details";
import { getAllCategories } from "@/queries/category";
import { getAllOfferTags } from "@/queries/offer-tag";

export default async function SellerProductsPage({
  params,
}: {
  params: { storeUrl: string };
}) {
    const paramsObj = await params;
  // Fetching products data from the database for the active store
  const products = await getAllStoreProducts(paramsObj.storeUrl);
  const offerTags = await getAllOfferTags();
  const categories = await getAllCategories();

  // console.log(offerTags);
  // console.log(categories);

  return (
    <DataTable
      actionButtonText={
        <>
          <Plus size={15} />
          Create product
        </>
      }
      isProduct={true}
      modalChildren={
        <ProductDetails
          categories={categories}
          offerTags={offerTags}
          storeUrl={paramsObj.storeUrl}
        />
      }
      newTabLink={`/dashboard/seller/stores/${paramsObj.storeUrl}/products/new`}
      filterValue="name"
      data={products}
      columns={columns}
      searchPlaceholder="Search product name..."
    />
  );
}
