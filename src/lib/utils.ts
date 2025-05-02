import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import ColorThief from "colorthief";
import { PrismaClient } from "@prisma/client";
import { db } from "./db";
import { CartProductType, Country } from "./types";
import countries from "@/data/countries.json";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to grid grid classnames dependng on length
export const getGridClassName = (length: number) => {
  switch (length) {
    case 2:
      return "grid-cols-2";
    case 3:
      return "grid-cols-2 grid-rows-2";
    case 4:
      return "grid-cols-2 grid-rows-1";
    case 5:
      return "grid-cols-2 grid-rows-6";
    case 6:
      return "grid-cols-2";
    default:
      return "";
  }
};

// Function to get prominent colors from an image
export const getDominantColors = (imgUrl: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imgUrl;
    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        const colors = colorThief.getPalette(img, 4).map((color) => {
          // Convert RGB array to hex string
          return `#${((1 << 24) + (color[0] << 16) + (color[1] << 8) + color[2])
            .toString(16)
            .slice(1)
            .toUpperCase()}`;
        });
        resolve(colors);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
  });
};

// Helper function to genarae a unique slug
export const generateUniqueSlug = async (
  baseSlug: string,
  model: keyof PrismaClient,
  field: string = "slug",
  separator: string = "-"
) => {
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const exisitngRecord = await (db[model] as any).findFirst({
      where: {
        [field]: slug,
      },
    });
    if (!exisitngRecord) {
      break;
    }
    slug = `${slug}${separator}${suffix}`;
    suffix += 1;
  }
  return slug;
};


// Define the helper function to get the user country
// Define the default country
const DEFAULT_COUNTRY: Country = {
  name: "United States",
  code: "US",
  city: "",
  region: "",
};

export async function getUserCountry(): Promise<Country> {
  let userCountry: Country = DEFAULT_COUNTRY;
  try {
    // Attempt to detect country by IP
    const response = await fetch(
      `https://ipinfo.io/?token=${process.env.IPINFO_TOKEN}`
    );

    if (response.ok) {
      const data = await response.json();
      userCountry = {
        name:
          // Ipinfo return the country code for the country field, so we need to find it in our countries.
          countries.find((c) => c.code === data.country)?.name || data.country,
        code: data.country,
        city: data.city,
        region: data.region,
      };
    }
  } catch (error) {
    // Log error if necessary but do not throw
    console.error("Failed to fetch IP info", error);
  }
  return userCountry;
}

/**
 * Function: getShippingDatesRange
 * Description: Returns the shipping date range by adding the specified min and max days to the current date.
 * Parameters:
 *    - minDays: Minimum number of days to add to the current date.
 *    - maxDays: Maximum number of days to add to the current date.
 * Returns: Object containing minDate and maxDate.
 */

export const getShippingDatesRange = (
  minDays: number,
  maxDays: number,
  date?: Date
): { minDate: string; maxDate: string } => {
  // Get the current date
  const currentDate = date ? new Date(date) : new Date();

  // Calculate minDate by adding minDays to current date
  const minDate = new Date(currentDate);
  minDate.setDate(currentDate.getDate() + minDays);

  // Calculate maxDate by adding maxDays to current date
  const maxDate = new Date(currentDate);
  maxDate.setDate(currentDate.getDate() + maxDays);

  // Return an object containing minDate and maxDate
  return {
    minDate: minDate.toDateString(),
    maxDate: maxDate.toDateString(),
  };
};


// Function to validate the product data before adding it to the cart
export const isProductValidToAdd = (product: CartProductType): boolean => {
  // Check that all required fields are filled
  const {
    productId,
    variantId,
    productSlug,
    variantSlug,
    name,
    variantName,
    image,
    quantity,
    price,
    sizeId,
    size,
    stock,
    shippingFee,
    extraShippingFee,
    shippingMethod,
    shippingService,
    variantImage,
    weight,
    deliveryTimeMin,
    deliveryTimeMax,
  } = product;

  // Ensure that all necessary fields have values
  if (
    !productId ||
    !variantId ||
    !productSlug ||
    !variantSlug ||
    !name ||
    !variantName ||
    !image ||
    quantity <= 0 ||
    price <= 0 ||
    !sizeId || // Ensure sizeId is not empty
    !size || // Ensure size is not empty
    stock <= 0 ||
    weight <= 0 || // Weight should be <= 0
    !shippingMethod ||
    !variantImage ||
    deliveryTimeMin < 0 ||
    deliveryTimeMax < deliveryTimeMin // Ensure delivery times are valid
  ) {
    return false; // Validation failed
  }

  return true; // Product is valid
};

// Handle product history in localStorage
export const updateProductHistory = (variantId: string) => {
  // Fetch existing product history from localStorage
  let productHistory: string[] = [];
  const historyString = localStorage.getItem("productHistory");

  if (historyString) {
    try {
      productHistory = JSON.parse(historyString);
    } catch (error) {
      productHistory = [];
    }
  }

  // Update the history: Remove the product if it exists, and add it to the front
  productHistory = productHistory.filter((id) => id !== variantId);
  productHistory.unshift(variantId);

  // Check storage limit (manage max number of products)
  const MAX_PRODUCTS = 100;
  if (productHistory.length > MAX_PRODUCTS) {
    productHistory.pop(); // Remove the oldest product
  }
  // Save updated history to localStorage
  localStorage.setItem("productHistory", JSON.stringify(productHistory));
};
