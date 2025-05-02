import { db } from "@/lib/db"
import { promises } from "dns";
import { redirect } from "next/navigation";

export default async function ProductPage({
    params
}: {
    params: Promise<{ productSlug: string }>
}) {
    const { productSlug } = await params;
    // Fetch the product from the database using the provided slug
    const product = await db.product.findUnique({
        where: {
            slug: productSlug,
        },
        include: { variants: true }, // Include product variants in the query
    });

    // console.log(product);

    // If the product is not found, redirect to the homepage
    if (!product) {
        return redirect('/');
    }

    // If the product has no variant, also redirect to the homepage
    // Technically impossible, but just in case
    if(!product.variants.length) {
        return redirect('/');
    }

    // If the product exists and has variant, redirect to the first variant page
    return redirect(`/product/${product.slug}/${product.variants[0].slug}`);
    // return redirect(`/product/${product.slug}?variant=${product.variants[0].slug}`);
}
