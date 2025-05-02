import { ProductType } from "@/lib/types";
import React from "react";
import ProductList from "../shared/product-list";

export default function RelatedProducts({
  products,
  selfId,
}: {
  products: ProductType[];
  selfId: string,
}) {
  // To excluded the product itself from the related products.
  const productsExcluded = products.filter((p) => p.id !== selfId);
  return (
    <div className="mt-4 space-y-1">
      <ProductList products={productsExcluded} title="You might also like..." />
    </div>
  );
}
