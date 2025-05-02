import Header from "@/components/store/layout/header/header";
import Footer from "@/components/store/layout/footer/footer";
import ProductList from "@/components/store/shared/product-list";
import { getProducts } from "@/queries/product";
import CategoriesHeader from "@/components/store/layout/categories-header/categories-header";

export default async function HomePage() {
  const productsData = await getProducts();
  const { products } = productsData;
  // console.log(products);
  return (
    <>
      <Header />
      <CategoriesHeader />
      <div className="p-14">
        <ProductList products={products} title="Products" arrow={true} />
      </div>
      <Footer />
    </>
  );
}
