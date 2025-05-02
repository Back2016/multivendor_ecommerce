"use server";

// db
import { db } from "@/lib/db";

// Types
import { FreeShippingWithCountriesType, ProductPageType, ProductShippingDetailsType, ProductWithVariantType, VariantImageType, VariantSimplified } from "@/lib/types";
import { Store } from "@prisma/client";

// Clerk
import { currentUser } from "@clerk/nextjs/server";

// Slugify
import slugify from "slugify";
import { generateUniqueSlug } from "@/lib/utils";

// Cookies
import { getCookie } from "cookies-next";
import { cookies } from "next/headers";
import { setMaxListeners } from "events";



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

        // Check if the variant already exists
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
            specs: {
                create: product.product_specs.map((spec) => ({
                    name: spec.name,
                    value: spec.value,
                })),
            },
            questions: {
                create: product.questions.map((q) => ({
                    question: q.question,
                    answer: q.answer,
                })),
            },
            store: { connect: { id: store.id } },
            category: { connect: { id: product.categoryId } },
            subCategory: { connect: { id: product.subCategoryId } },
            offerTag: { connect: { id: product.offerTagId } },
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        };

        const commonVariantData = {
            variantName: product.variantName,
            variantDescription: product.variantDescription,
            slug: variantSlug,
            isSale: product.isSale,
            saleEndDate: product.isSale ? product.saleEndDate : "",
            sku: product.sku,
            weight: product.weight,
            keywords: product.keywords.join(","),
            images: {
                create: product.images.map((img) => ({
                    url: img.url,
                    alt: img.url.split("/").pop() || "",
                })),
            },
            variantImage: product.variantImage,
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
            specs: {
                create: product.variant_specs.map((spec) => ({
                    name: spec.name,
                    value: spec.value,
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
            console.log("Trying to create variant.");
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
            console.log("Trying to create new product.");
            return await db.product.create({ data: productData });
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
};

// Function: getProductMainInfo
// Description: Retrieves the main information of a specific product from the database.
// Access Level: Public
// Parameters:
//   - productId: The ID of the product to be retrieved.
// Returns: An object containing the main information of the product or null if the product is not found.
export const getProductMainInfo = async (productId: string) => {
    // Retrieve the product from the database
    const product = await db.product.findUnique({
        where: {
            id: productId,
        },
        include: {
            questions: true,
            specs: true,
        },
    });
    // console.log(product);
    if (!product) return null;

    // Return the main information of the product
    return {
        productId: product.id,
        name: product.name,
        description: product.description,
        brand: product.brand,
        categoryId: product.categoryId,
        subCategoryId: product.subCategoryId,
        offerTagId: product.offerTagId || undefined,
        storeId: product.storeId,
        questions: product.questions.map((q) => ({
            question: q.question,
            answer: q.answer,
        })),
        product_specs: product.specs.map((spec) => ({
            name: spec.name,
            value: spec.value,
        })),
        images: [],
    };
};

// Function: getAllStoreProducts
// Description: Retrieves all products from a specific store based on the store URL.
// Access Level: Public
// Parameters:
//   - storeUrl: The URL of the store whose products are to be retrieved.
// Returns: Array of products from the specified store, including category, subcategory, and variant details.
export const getAllStoreProducts = async (storeUrl: string) => {
    // Retrieve store details from the database using the store URL
    const store = await db.store.findUnique({ where: { url: storeUrl } });
    if (!store) throw new Error("Please provide a valid store URL.");

    // Retrieve all products associated with the store
    const products = await db.product.findMany({
        where: {
            storeId: store.id,
        },
        include: {
            category: true,
            subCategory: true,
            variants: {
                include: {
                    images: true,
                    colors: true,
                    sizes: true,
                },
            },
            store: {
                select: {
                    id: true,
                    url: true,
                },
            },
        },
    });

    return products;
};

// Function: deleteProduct
// Description: Deletes a product from the database.
// Permission Level: Seller only
// Parameters:
//   - productId: The ID of the product to be deleted.
// Returns: Response indicating success or failure of the deletion operation.
export const deleteProduct = async (productId: string) => {
    // Get current user
    const user = await currentUser();

    // Check if user is authenticated
    if (!user) throw new Error("Unauthenticated.");

    // Ensure user has seller privileges
    if (user.privateMetadata.role !== "SELLER")
        throw new Error(
            "Unauthorized Access: Seller Privileges Required for Entry."
        );

    // Ensure product data is provided
    if (!productId) throw new Error("Please provide product id.");

    // Delete product from the database
    const response = await db.product.delete({ where: { id: productId } });
    return response;
};


// Function: getProducts
// Description: Retrieves products based on various filters and returns only variants that match the filters. Supports pagination.
// Access Level: Public
// Parameters:
//   - filters: An object containing filter options (category, subCategory, offerTag, size, onSale, onDiscount, brand, color).
//   - sortBy: Sort the filtered results (Most popular, New Arrivals, Top Rated...).
//   - page: The current page number for pagination (default = 1).
//   - pageSize: The number of products per page (default = 10).
// Returns: An object containing paginated products, filtered variants, and pagination metadata (totalPages, currentPage, pageSize, totalCount).
export const getProducts = async (
    filters: any = {},
    sortBy: string = "",
    page: number = 1,
    pageSize: number = 10
) => {
    // Default values for page and pageSize
    const currentPage = page;
    const limit = pageSize;
    const skip = (currentPage - 1) * limit; // How many products to skip (in previous pages), prisma take in skip in findMany

    // Construct the base query
    const whereClause: any = {
        AND: [],
    };

    // Apply store filter (using store URL)
    if (filters.store) {
        const store = await db.store.findUnique({
            where: {
                url: filters.store,
            },
            select: { id: true },
        });
        if (store) {
            whereClause.AND.push({ storeId: store.id });
        }
    }

    // Apply category filter (using category URL)
    if (filters.category) {
        const category = await db.category.findUnique({
            where: {
                url: filters.category,
            },
            select: { id: true },
        });
        if (category) {
            whereClause.AND.push({ categoryId: category.id });
        }
    }

    // Apply subCategory filter (using subCategory URL)
    if (filters.subCategory) {
        const subCategory = await db.subCategory.findUnique({
            where: {
                url: filters.subCategory,
            },
            select: { id: true },
        });
        if (subCategory) {
            whereClause.AND.push({ subCategoryId: subCategory.id });
        }
    }

    // Define the sort order
    // let orderBy: Record<string, SortOrder> = {};
    // switch (sortBy) {
    //     case "most-popular":
    //         orderBy = { views: "desc" };
    //         break;
    //     case "new-arrivals":
    //         orderBy = { createdAt: "desc" };
    //         break;
    //     case "top-rated":
    //         orderBy = { rating: "desc" };
    //         break;
    //     default:
    //         orderBy = { views: "desc" };
    // }

    // Get all filtered, sorted products
    const products = await db.product.findMany({
        where: whereClause,
        // orderBy,
        take: limit, // Limit to page size
        skip: skip, // Skip the products of previous pages
        include: {
            variants: {
                include: {
                    sizes: true,
                    images: true,
                    colors: true,
                },
            },
        },
    });

    // Transform the products with filtered variants into ProductCardType structure
    const productsWithFilteredVariants = products.map((product) => {
        // Filter the variants based on the filters
        const filteredVariants = product.variants;

        // Transform the filtered variants into the VariantSimplified structure
        const variants: VariantSimplified[] = filteredVariants.map((variant) => ({
            variantId: variant.id,
            variantSlug: variant.slug,
            variantName: variant.variantName,
            images: variant.images,
            sizes: variant.sizes,
        }));

        // Extract variant images for the product
        const variantImages: VariantImageType[] = filteredVariants.map(
            (variant) => ({
                url: `/product/${product.slug}/${variant.slug}`,
                image: variant.variantImage
                    ? variant.variantImage
                    : variant.images[0].url,
            })
        );

        // Return the product in the ProductCardType structure
        return {
            id: product.id,
            slug: product.slug,
            name: product.name,
            rating: product.rating,
            sales: product.sales,
            // numReviews: product.numReviews,
            variants,
            variantImages,
        };
    });

    const totalCount = products.length;

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / pageSize);

    // Return the paginated data along with metadata
    return {
        products: productsWithFilteredVariants,
        totalPages,
        currentPage,
        pageSize,
        totalCount,
    };
}


// Function: getProductPageData
// Description: Retrieves details of a specific product variant from the database.
// Access Level: Public
// Parameters:
//   - productSlug: The slug of the product to which the variant belongs.
//   - variantSlug: The slug of the variant to be retrieved.
// Returns: Details of the requested product variant.
export const getProductPageData = async (
    productSlug: string,
    variantSlug: string,
) => {
    // Retrieve product variant details from the database
    const product = await retrieveProductDetails(productSlug, variantSlug);
    if (!product) return;

    // Retrieve user country
    const userCountry = await getUserCountry();

    // Calculate and retrieve the shipping details
    const productShippingDetails = await getShippingDetails(
        product.shippingFeeMethod,
        userCountry,
        product.store,
        product.freeShipping
    );

    // console.log(productShippingDetails);

    return formatProductResponse(
        product,
        productShippingDetails,
    );
}
//----------------------------------------//
// Helper functions for getProductPageData
export const retrieveProductDetails = async (
    productSlug: string,
    variantSlug: string,
) => {
    const product = await db.product.findUnique({
        where: {
            slug: productSlug,
        },
        include: {
            category: true,
            subCategory: true,
            offerTag: true,
            store: true,
            specs: true,
            questions: true,
            freeShipping: {
                include: {
                    eligibleCountries: true,
                }
            },
            variants: {
                where: {
                    slug: variantSlug,
                },
                include: {
                    images: true,
                    colors: true,
                    sizes: true,
                    specs: true,
                }
            },
        },
    });

    if (!product) return null;
    // Get variants info
    const variantsInfo = await db.productVariant.findMany({
        where: {
            productId: product.id,
        },
        include: {
            images: true,
            sizes: true,
            colors: true,
            product: {
                select: { slug: true },
            },
        },
    });

    return {
        ...product,
        variantsInfo: variantsInfo.map((variant) => ({
            variantName: variant.variantName,
            variantSlug: variant.slug,
            variantImage: variant.variantImage,
            variantUrl: `/product/${productSlug}/${variant.slug}`,
            images: variant.images,
            sizes: variant.sizes,
            colors: variant.colors,
        })),
    };
};

const formatProductResponse = (product: ProductPageType, shippingDetails: ProductShippingDetailsType,) => {
    if (!product) return;
    const variant = product.variants[0];
    const { store, category, subCategory, offerTag, questions } = product;
    const { images, colors, sizes } = variant;

    return {
        productId: product.id,
        variantId: variant.id,
        productSlug: product.slug,
        variantSlug: variant.slug,
        name: product.name,
        description: product.description,
        variantName: variant.variantName,
        variantDescription: variant.variantDescription,
        images,
        category,
        subCategory,
        offerTag,
        isSale: variant.isSale,
        saleEndDate: variant.saleEndDate,
        brand: product.brand,
        sku: variant.sku,
        weight: variant.weight,
        variantImage: variant.variantImage,
        store: {
            id: store.id,
            url: store.url,
            name: store.name,
            logo: store.logo,
            followersCount: 10, // Need to be added
            isUserFollowingStore: true, // Need to be added
        },
        colors,
        sizes,
        specs: {
            product: product.specs,
            variant: variant.specs,
        },
        questions,
        rating: product.rating,
        reviews: [],
        numReviews: 122,
        reviewsStatistics: {
            ratingStatistics: [],
            reviewsWithImagesCount: 5,
        },
        shippingDetails,
        relatedProducts: [],
        variantInfo: product.variantsInfo,
    };
};

const getUserCountry = async () => {
    const userCountryCookie = await getCookie("userCountry", { cookies }) || "";
    const defaultCountry = { name: "United States", code: "US" };

    try {
        const parsedCountry = JSON.parse(userCountryCookie);
        if (
            parsedCountry &&
            typeof parsedCountry === "object" &&
            "name" in parsedCountry &&
            "code" in parsedCountry
        ) {
            return parsedCountry;
        }
        return defaultCountry;
    } catch (error) {
        console.error("Failed to parse userCountryCookie", error);
    }
};

// Function: getProductVariant
// Description: Retrieves details of a specific product variant from the database.
// Access Level: Public
// Parameters:
//   - productId: The id of the product to which the variant belongs.
//   - variantId: The id of the variant to be retrieved.
// Returns: Details of the requested product variant.
export const getProductVariant = async (
    productId: string,
    variantId: string
) => {
    // Retrieve product variant details from the database
    const product = await db.product.findUnique({
        where: {
            id: productId,
        },
        include: {
            category: true,
            subCategory: true,
            variants: {
                where: {
                    id: variantId,
                },
                include: {
                    images: true,
                    colors: {
                        select: {
                            name: true,
                        },
                    },
                    sizes: {
                        select: {
                            size: true,
                            quantity: true,
                            price: true,
                            discount: true,
                        },
                    },
                },
            },
        },
    });
    if (!product) return;
    return {
        productId: product?.id,
        variantId: product?.variants[0].id,
        name: product.name,
        description: product?.description,
        variantName: product.variants[0].variantName,
        variantDescription: product.variants[0].variantDescription,
        images: product.variants[0].images,
        categoryId: product.categoryId,
        subCategoryId: product.subCategoryId,
        isSale: product.variants[0].isSale,
        brand: product.brand,
        sku: product.variants[0].sku,
        colors: product.variants[0].colors,
        sizes: product.variants[0].sizes,
        keywords: product.variants[0].keywords.split(","),
    };
};

// Function: getShippingDetails
// Description: Retrieves and calculates shipping details based on user country and product.
// Access Level: Public
// Parameters:
//   - shippingFeeMethod: The shipping fee method of the product.
//   - userCountry: The parsed user country object from cookies.
//   - store :  store details.
// Returns: Calculated shipping details.
export const getShippingDetails = async (
    shippingFeeMethod: string,
    userCountry: { name: string; code: string; city: string },
    store: Store,
    freeShipping: FreeShippingWithCountriesType | null
) => {
    let shippingDetails = {
        shippingFeeMethod,
        shippingService: "",
        shippingFee: 0,
        extraShippingFee: 0,
        deliveryTimeMin: 0,
        deliveryTimeMax: 0,
        returnPolicy: "",
        countryCode: userCountry.code,
        countryName: userCountry.name,
        city: userCountry.city,
        isFreeShipping: false,
    };
    const country = await db.country.findUnique({
        where: {
            name: userCountry.name,
            code: userCountry.code,
        },
    });

    if (country) {
        // Retrieve shipping rate for the country
        const shippingRate = await db.shippingRate.findFirst({
            where: {
                countryId: country.id,
                storeId: store.id,
            },
        });

        const returnPolicy = shippingRate?.returnPolicy || store.returnPolicy;
        const shippingService =
            shippingRate?.shippingService || store.defaultShippingService;
        const shippingFeePerItem =
            shippingRate?.shippingFeePerItem || store.defaultShippingFeePerItem;
        const shippingFeeForAdditionalItem =
            shippingRate?.shippingFeeForAdditionalItem ||
            store.defaultShippingFeeForAdditionalItem;
        const shippingFeePerKg =
            shippingRate?.shippingFeePerKg || store.defaultShippingFeePerKg;
        const shippingFeeFixed =
            shippingRate?.shippingFeeFixed || store.defaultShippingFeeFixed;
        const deliveryTimeMin =
            shippingRate?.deliveryTimeMin || store.defaultDeliveryTimeMin;
        const deliveryTimeMax =
            shippingRate?.deliveryTimeMax || store.defaultDeliveryTimeMax;

        // Check for free shipping
        if (freeShipping) {
            const free_shipping_countries = freeShipping.eligibleCountries;
            const check_free_shipping = free_shipping_countries.find(
                (c) => c.countryId === country.id
            );
            if (check_free_shipping) {
                shippingDetails.isFreeShipping = true;
            }
        }
        shippingDetails = {
            shippingFeeMethod,
            shippingService: shippingService,
            shippingFee: 0,
            extraShippingFee: 0,
            deliveryTimeMin,
            deliveryTimeMax,
            returnPolicy,
            countryCode: userCountry.code,
            countryName: userCountry.name,
            city: userCountry.city,
            isFreeShipping: shippingDetails.isFreeShipping,
        };

        const { isFreeShipping } = shippingDetails;
        switch (shippingFeeMethod) {
            case "ITEM":
                shippingDetails.shippingFee = isFreeShipping ? 0 : shippingFeePerItem;
                shippingDetails.extraShippingFee = isFreeShipping
                    ? 0
                    : shippingFeeForAdditionalItem;
                break;

            case "WEIGHT":
                shippingDetails.shippingFee = isFreeShipping ? 0 : shippingFeePerKg;
                break;

            case "FIXED":
                shippingDetails.shippingFee = isFreeShipping ? 0 : shippingFeeFixed;
                break;

            default:
                break;
        }

        return shippingDetails;
    }
    return false;
};
