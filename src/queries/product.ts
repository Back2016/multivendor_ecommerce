"use server";

// db
import { db } from "@/lib/db";

// Types
import { ProductWithVariantType } from "@/lib/types";

// Clerk
import { currentUser } from "@clerk/nextjs/server";

// Slugify
import slugify from "slugify";
import { generateUniqueSlug } from "@/lib/utils";
import { connect } from "http2";


// Function: upsertProduct
// Description: Upserts a product and its variant into the database, ensuring proper association with the store.
// Access Level: Seller Only
// Parameters:
//   - product: ProductWithVariant object containing details of the product and its variant.
//   - storeUrl: The URL of the store to which the product belongs.
// Returns: Newly created or updated product with variant details.
export const upsertProduct = async (
    product: ProductWithVariantType,
    storeUrl: string
) => {
    try {
        // Retrieve current user
        const user = await currentUser();

        // Check if user is authenticated
        if (!user) throw new Error("Unauthenticated.");

        // Ensure user has seller privileges
        if (user.privateMetadata.role !== "SELLER")
            throw new Error(
                "Unauthorized Access: Seller Privileges Required for Entry."
            );

        // Ensure product data is provided
        if (!product) throw new Error("Please provide product data.");

        // Find the store by URL
        const store = await db.store.findUnique({
            where: { url: storeUrl, userId: user.id },
        });
        if (!store) throw new Error("Store not found.");

        // Check if the product already exists
        const existingProduct = await db.product.findUnique({
            where: { id: product.productId },
        });

        // // Check if the variant already exists
        // const existingVariant = await db.productVariant.findUnique({
        //     where: { id: product.variantId },
        // });

        // Generate unique slugs for product and variant
        const productSlug = await generateUniqueSlug(
            slugify(product.name, {
                replacement: "-",
                lower: true,
                trim: true,
            }),
            "product"
        );

        const variantSlug = await generateUniqueSlug(
            slugify(product.variantName, {
                replacement: "-",
                lower: true,
                trim: true,
            }),
            "productVariant"
        );

        // Common data for product and variant
        const commonProductData = {
            name: product.name,
            description: product.description,
            slug: productSlug,
            brand: product.brand,
            store: { connect: { id: store.id } },
            category: { connect: { id: product.categoryId } },
            subCategory: { connect: { id: product.subCategoryId } },
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        };

        const commonVariantData = {
            variantName: product.variantName,
            variantDescription: product.variantDescription,
            slug: variantSlug,
            isSale: product.isSale,
            sku: product.sku,
            keywords: product.keywords.join(","),
            images: {
                create: product.images.map((img) => ({
                    url: img.url,
                    alt: img.url.split("/").pop() || "",
                })),
            },
            colors: {
                create: product.colors.map((color) => ({
                    name: color.color,
                })),
            },
            sizes: {
                create: product.sizes.map((size) => ({
                    size: size.size,
                    price: size.price,
                    quantity: size.quantity,
                    discount: size.discount,
                })),
            },
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        }

        if (existingProduct) {
            // If product exists, create a variant
            const variantData = {
                ...commonVariantData,
                product: { connect: { id: product.productId } },
            }
            return await db.productVariant.create({ data: variantData });
        } else {
            // Otherwise, create a new product with variants
            const productData = {
                ...commonProductData,
                id: product.productId,
                variants: {
                    create: [{
                        id: product.variantId,
                        ...commonVariantData,
                    }]
                }
            };
            return await db.product.create({ data: productData });
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
};

// const handleProductCreate = async (
//     product: ProductWithVariantType,
//     storeId: string
// ) => {
//     // Generate unique slugs for product and variant
//     const productSlug = await generateUniqueSlug(
//         slugify(product.name, {
//             replacement: "-",
//             lower: true,
//             trim: true,
//         }),
//         "product"
//     );

//     const variantSlug = await generateUniqueSlug(
//         slugify(product.variantName, {
//             replacement: "-",
//             lower: true,
//             trim: true,
//         }),
//         "productVariant"
//     );

//     const productData = {
//         id: product.productId,
//         name: product.name,
//         description: product.description,
//         slug: productSlug,
//         store: { connect: { id: storeId } },
//         category: { connect: { id: product.categoryId } },
//         subCategory: { connect: { id: product.subCategoryId } },
//         offerTag: { connect: { id: product.offerTagId } },
//         brand: product.brand,
//         specs: {
//             create: product.product_specs.map((spec) => ({
//                 name: spec.name,
//                 value: spec.value,
//             })),
//         },
//         questions: {
//             create: product.questions.map((q) => ({
//                 question: q.question,
//                 answer: q.answer,
//             })),
//         },
//         variants: {
//             create: [
//                 {
//                     id: product.variantId,
//                     variantName: product.variantName,
//                     variantDescription: product.variantDescription,
//                     slug: variantSlug,
//                     variantImage: product.variantImage,
//                     sku: product.sku,
//                     weight: product.weight,
//                     keywords: product.keywords.join(","),
//                     isSale: product.isSale,
//                     saleEndDate: product.saleEndDate,
//                     images: {
//                         create: product.images.map((img) => ({
//                             url: img.url,
//                         })),
//                     },
//                     colors: {
//                         create: product.colors.map((color) => ({
//                             name: color.color,
//                         })),
//                     },
//                     sizes: {
//                         create: product.sizes.map((size) => ({
//                             size: size.size,
//                             price: size.price,
//                             quantity: size.quantity,
//                             discount: size.discount,
//                         })),
//                     },
//                     specs: {
//                         create: product.variant_specs.map((spec) => ({
//                             name: spec.name,
//                             value: spec.value,
//                         })),
//                     },
//                     createdAt: product.createdAt,
//                     updatedAt: product.updatedAt,
//                 },
//             ],
//         },
//         shippingFeeMethod: product.shippingFeeMethod,
//         freeShippingForAllCountries: product.freeShippingForAllCountries,
//         freeShipping: product.freeShippingForAllCountries
//             ? undefined
//             : product.freeShippingCountriesIds &&
//                 product.freeShippingCountriesIds.length > 0
//                 ? {
//                     create: {
//                         eligibaleCountries: {
//                             create: product.freeShippingCountriesIds.map((country) => ({
//                                 country: { connect: { id: country.value } },
//                             })),
//                         },
//                     },
//                 }
//                 : undefined,
//         createdAt: product.createdAt,
//         updatedAt: product.updatedAt,
//     };

//     const new_product = await db.product.create({ data: productData });
//     return new_product;
// };

// const handleCreateVariant = async (product: ProductWithVariantType) => {
//     const variantSlug = await generateUniqueSlug(
//         slugify(product.variantName, {
//             replacement: "-",
//             lower: true,
//             trim: true,
//         }),
//         "productVariant"
//     );

//     const variantData = {
//         id: product.variantId,
//         productId: product.productId,
//         variantName: product.variantName,
//         variantDescription: product.variantDescription,
//         slug: variantSlug,
//         isSale: product.isSale,
//         saleEndDate: product.isSale ? product.saleEndDate : "",
//         sku: product.sku,
//         keywords: product.keywords.join(","),
//         weight: product.weight,
//         variantImage: product.variantImage,
//         images: {
//             create: product.images.map((img) => ({
//                 url: img.url,
//             })),
//         },
//         colors: {
//             create: product.colors.map((color) => ({
//                 name: color.color,
//             })),
//         },
//         sizes: {
//             create: product.sizes.map((size) => ({
//                 size: size.size,
//                 price: size.price,
//                 quantity: size.quantity,
//                 discount: size.discount,
//             })),
//         },
//         specs: {
//             create: product.variant_specs.map((spec) => ({
//                 name: spec.name,
//                 value: spec.value,
//             })),
//         },
//         createdAt: product.createdAt,
//         updatedAt: product.updatedAt,
//     };

//     const new_variant = await db.productVariant.create({ data: variantData });
//     return new_variant;
// };
