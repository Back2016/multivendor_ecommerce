import { getAllSubCategories } from "@/queries/subCategory";
import { getAllStoreProducts } from "@/queries/product";
import {
  Prisma,
  ShippingRate
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
