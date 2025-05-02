import { getAllSubCategories } from "@/queries/subCategory";
import { getAllStoreProducts, getProductPageData, getProducts, getShippingDetails, retrieveProductDetails } from "@/queries/product";
import {
  Color,
  FreeShipping,
  FreeShippingCountry,
  Prisma,
  ProductVariantImage,
  ShippingRate,
  Size
} from "@prisma/client";
import { getStoreDefaultShippingDetails } from "@/queries/store";

import countries from "@/data/countries.json";

export interface DashboardSidebarMenuInterface {
  label: string;
  icon: string;
  link: string;
}

// SubCategory + parent category
export type SubCategoryWithCategoryType = Prisma.PromiseReturnType<
  typeof getAllSubCategories
>[0]; // In subCategory.ts, when we return subCategories, we include: { category: true }, so it has the category


// Product + variant
export type ProductWithVariantType = {
  productId: string;
  variantId: string;
  name: string;
  description: string;
  variantName: string;
  variantDescription: string;
  variantImage: string;
  images: { url: string }[];
  categoryId: string;
  offerTagId: string;
  subCategoryId: string;
  isSale?: boolean;
  saleEndDate?: string,
  brand: string;
  sku: string;
  weight: number;
  colors: { color: string }[];
  sizes: { size: string; quantity: number; price: number; discount?: number }[];
  product_specs: { id?: string; name: string; value: string }[];
  variant_specs: { id?: string; name: string; value: string }[];
  keywords: string[];
  questions: { id?: string; question: string; answer: string }[];
  createdAt: Date;
  updatedAt: Date;
}

// Store product
export type StoreProductType = Prisma.PromiseReturnType<
  typeof getAllStoreProducts
>[0];

// Store default shipping details
export type StoreDefaultShippingType = Prisma.PromiseReturnType<
  typeof getStoreDefaultShippingDetails
>;

// Country with shipping rates type
export type CountryWithShippingRatesType = {
  countryId: string;
  countryName: string;
  shippingRate: ShippingRate;
};

// Country type for get user country
export interface Country {
  name: string;
  code: string;
  city: string;
  region: string;
}


export type SelectMenuOption = (typeof countries)[number];

export type ProductType = Prisma.PromiseReturnType<
  typeof getProducts
>["products"][0];

export type VariantSimplified = {
  variantId: string;
  variantSlug: string;
  variantName: string;
  images: ProductVariantImage[];
  sizes: Size[];
};

export type VariantImageType = {
  url: string;
  image: string;
};

export type ProductPageType = Prisma.PromiseReturnType<
  typeof retrieveProductDetails
>;

export type ProductPageDataType = Prisma.PromiseReturnType<
  typeof getProductPageData
>;

export type CartProductType = {
  productId: string;
  variantId: string;
  productSlug: string;
  variantSlug: string;
  name: string;
  variantName: string;
  image: string;
  variantImage: string;
  sizeId: string;
  size: string;
  quantity: number;
  price: number;
  stock: number;
  weight: number;
  shippingMethod: string;
  shippingService: string;
  shippingFee: number;
  extraShippingFee: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  isFreeShipping: boolean;
};

export type VariantInfoType = {
  variantName: string;
  variantSlug: string;
  variantImage: string;
  variantUrl: string;
  images: ProductVariantImage[];
  sizes: Size[];
  colors: Partial<Color>[];
};

export type ProductShippingDetailsType = Prisma.PromiseReturnType<
  typeof getShippingDetails
>;

export type FreeShippingWithCountriesType = FreeShipping & {
  eligibleCountries: FreeShippingCountry[];
};
