// Product Details form
import ProductDetails from "@/components/dashboard/forms/product-details";

// Queries
import { getAllCategories } from "@/queries/category";
import { getProductMainInfo } from "@/queries/product";

export default async function SellerNewProductVariantPage({
  params,
}: {
  params: { storeUrl: string; productId: string };
}) {
  const paramsObj = await params;
  const categories = await getAllCategories();
  const product = await getProductMainInfo(paramsObj.productId);

//   console.log(product);
//   console.log("productId--->", paramsObj.productId);

  if (!product) return null;
  return (
    <div>
      <ProductDetails
        categories={categories}
        storeUrl={paramsObj.storeUrl}
        data={product}
      />
    </div>
  );
}
