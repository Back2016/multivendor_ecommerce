"use client";

// Prisma model
import { Category, SubCategory, OfferTag } from "@prisma/client";


// React
import { FC, useEffect, useState, useRef, useMemo } from "react";

// Form handling utilities
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Schema
import { ProductFormSchema } from "@/lib/schemas";

// shadcn/ui
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ImageUpload from "../shared/image-upload";

// Queries
import { upsertProduct } from "@/queries/product";
import { getAllSubCategoriesForCategory } from "@/queries/category";

// ReactTags
import { WithOutContext as ReactTags } from "react-tag-input";

// Utils
import { v4 } from "uuid";
import { toast } from "sonner";
import { useRouter } from "next/navigation";


// Type
import { ProductWithVariantType } from "@/lib/types";

import ImagesPreviewGrid from "../shared/images-preview-grid";
import ClickToAddInputs from "./click-to-add";

// Jodit text editor
import JoditEditor from "jodit-react";
import InputFieldset from "../shared/input-fieldset";
import { useTheme } from "next-themes";

// React date time picker
import DateTimePicker from "react-datetime-picker";
import "react-datetime-picker/dist/DateTimePicker.css";
import "react-calendar/dist/Calendar.css";
import "react-clock/dist/Clock.css";
import { format } from "date-fns";
import { ArrowRight, Dot } from "lucide-react";


interface ProductDetailsProps {
    data?: Partial<ProductWithVariantType>;
    categories: Category[];
    offerTags: OfferTag[];
    storeUrl: string;
}

const ProductDetails: FC<ProductDetailsProps> = ({ data, categories, offerTags, storeUrl }) => {
    const router = useRouter(); // Hook for routing

    // Is new variant page
    const isNewVariantPage = data?.productId && !data?.variantId;
    console.log("is new variant --> ", isNewVariantPage);

    // Jodit editor refs
    const productDescEditor = useRef(null);
    const variantDescEditor = useRef(null);

    // Jodit configuration
    const { theme } = useTheme();

    const config = useMemo(
        () => ({
            theme: theme === "dark" ? "dark" : "default",
        }),
        [theme]
    );

    // console.log(offerTags);

    // State for subCategories
    const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

    // State for colors
    const [colors, setColors] = useState<{ color: string }[]>(
        data?.colors || [{ color: "" }]
    );

    // Temporary state for images
    const [images, setImages] = useState<{ url: string }[]>([]);

    // State for sizes
    const [sizes, setSizes] = useState<
        { size: string; price: number; quantity: number; discount?: number }[]
    >(data?.sizes || [{ size: "", quantity: 1, price: 0.01, discount: 0 }]);

    // State for product specs
    const [productSpecs, setProductSpecs] = useState<
        { name: string; value: string }[]
    >(data?.product_specs || [{ name: "", value: "" }]);

    console.log("data --> ", data);
    console.log("productSpecs --> ", productSpecs);

    // State for product variant specs
    const [variantSpecs, setVariantSpecs] = useState<
        { name: string; value: string }[]
    >(data?.variant_specs || [{ name: "", value: "" }]);

    // State for product variant specs
    const [questions, setQuestions] = useState<
        { question: string; answer: string }[]
    >(data?.questions || [{ question: "", answer: "" }]);

    // type Probe = z.infer<typeof ProductFormSchema>; // Debugging type line

    // Form hook for managing form state and validation
    const form = useForm<z.infer<typeof ProductFormSchema>>({
        mode: "onChange",
        resolver: zodResolver(ProductFormSchema),
        defaultValues: {
            name: data?.name ?? "",
            description: data?.description ?? "",
            variantName: data?.variantName ?? "",
            variantDescription: data?.variantDescription ?? "",
            images: data?.images || [],
            variantImage: data?.variantImage ? [{ url: data.variantImage }] : [],
            categoryId: data?.categoryId ?? "",
            offerTagId: data?.offerTagId ?? "",
            subCategoryId: data?.subCategoryId ?? "",
            brand: data?.brand ?? "",
            sku: data?.sku ?? "",
            colors: data?.colors || [{ color: "" }],
            sizes: data?.sizes,
            product_specs: data?.product_specs,
            variant_specs: data?.variant_specs,
            keywords: data?.keywords || [],
            questions: data?.questions,
            isSale: data?.isSale ?? false,
            saleEndDate: data?.saleEndDate || format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        },
    });

    //              sizes:
    // data?.sizes?.map((s) => ({ ...s, discount: s.discount ?? 0 })) ?? [
    //     { size: "", quantity: 1, price: 0.01, discount: 0 },
    // ],

    const saleEndDate = form.getValues().saleEndDate || new Date().toISOString();

    const formattedDate = new Date(saleEndDate).toLocaleString("en-Us", {
        weekday: "short", // Abbreviated day name (e.g., "Mon")
        month: "long", // Abbreviated month name (e.g., "Nov")
        day: "2-digit", // Two-digit day (e.g., "25")
        year: "numeric", // Full year (e.g., "2024")
        hour: "2-digit", // Two-digit hour (e.g., "02")
        minute: "2-digit", // Two-digit minute (e.g., "30")
        second: "2-digit", // Two-digit second (optional)
        hour12: false, // 12-hour format (change to false for 24-hour format)
    });

    //console.log("date--->",formattedDate);

    // UseEffect to get subCategories when user pick/change a category
    useEffect(() => {
        const getSubCategories = async () => {
            const res = await getAllSubCategoriesForCategory(form.watch().categoryId);
            setSubCategories(res);
        };
        form.setValue("subCategoryId", "");
        getSubCategories();
    }, [form.watch().categoryId]);

    // Extract errors state from form
    const errors = form.formState.errors;
    console.log("errors", errors);

    // Loading status based on form submission
    const isLoading = form.formState.isSubmitting;

    // Always show lastest data
    useEffect(() => {
        if (data) {
            form.reset({ ...data, variantImage: [{ url: data.variantImage }] })
        }
    }, [data, form]);

    // Submit handler for form submission
    const handleSubmit = async (values: z.infer<typeof ProductFormSchema>) => {
        // console.log("VALUES SENT TO SERVER", values); // Debuging line
        console.log("variantDescription in RHF:", values.variantDescription);
        try {
            // Upserting store data
            const response = await upsertProduct({
                productId: data?.productId ? data.productId : v4(),
                variantId: data?.variantId ? data.variantId : v4(),
                name: values.name,
                description: values.description,
                variantName: values.variantName,
                variantDescription: values.variantDescription || "",
                variantImage: values.variantImage[0].url,
                categoryId: values.categoryId,
                subCategoryId: values.subCategoryId,
                offerTagId: values.offerTagId || "",
                images: values.images,
                isSale: values.isSale,
                saleEndDate: values.saleEndDate,
                brand: values.brand,
                sku: values.sku,
                colors: values.colors,
                sizes: values.sizes,
                product_specs: values.product_specs,
                variant_specs: values.variant_specs,
                keywords: values.keywords,
                questions: values.questions,
                createdAt: new Date(),
                updatedAt: new Date(),
            }, storeUrl);

            toast(data?.productId && data?.variantId
                ? "Product has been updated."
                : `Congratulations! product '${response?.slug}' is now created.`);

            // Redirect or Refresh data
            if (data?.productId && data?.variantId) {
                router.refresh();
            } else {
                router.push(`/dashboard/seller/stores/${storeUrl}/products`);
                router.refresh();
            }
        } catch (error: any) {
            // Handling form submission errors
            console.log(error);
            toast.error("Oops!", {
                description: error.toString(),
            });
        }
    }

    // Handle keywords input
    const [keywords, setKeywords] = useState<string[]>(data?.keywords || []);

    interface Keyword {
        id: string;
        text: string;
    }

    const handleAddition = (keyword: Keyword) => {
        if (keywords.length === 10) return;
        setKeywords([...keywords, keyword.text]);
    };

    const handleDeleteKeyword = (i: number) => {
        setKeywords(keywords.filter((_, index) => index !== i));
    };

    // Whenever colors, sizes, keywords changes we update the form values
    useEffect(() => {
        form.setValue("colors", colors || []);
        form.setValue("sizes", sizes || []);
        form.setValue("keywords", keywords || []);
        form.setValue("product_specs", productSpecs);
        form.setValue("variant_specs", variantSpecs);
        form.setValue("questions", questions);
    }, [colors, sizes, keywords, productSpecs, variantSpecs, questions, data]);

    // console.log("form sizes", form.watch().sizes);

    return (
        <AlertDialog>
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Product Information</CardTitle>
                    <CardDescription>
                        {data?.productId && data.variantId
                            ? `Update ${data?.name} product information.`
                            : " Lets create a product. You can edit product later from the product page."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form
                            //@ts-ignore
                            onSubmit={form.handleSubmit(handleSubmit)}
                            className="space-y-4"
                        >
                            {/* Images - Colors */}
                            <div className="flex flex-col gap-y-6 xl:flex-row">
                                {/* Images */}
                                <FormField
                                    control={form.control}
                                    name="images"
                                    render={({ field }) => {
                                        return (
                                            <FormItem>
                                                <FormControl>
                                                    <div>
                                                        <ImagesPreviewGrid
                                                            images={form.getValues().images}
                                                            onRemove={(url) => {
                                                                const updatedImages = images.filter(
                                                                    (img) => img.url !== url
                                                                );
                                                                setImages(updatedImages);
                                                                field.onChange(updatedImages);
                                                            }}
                                                            colors={colors}
                                                            setColors={setColors}
                                                        />
                                                        <FormMessage className="!mt-4" />
                                                        <ImageUpload
                                                            dontShowPreview
                                                            type="standard"
                                                            value={field.value.map((image) => image.url)}
                                                            disabled={isLoading}
                                                            onChange={(url) => {
                                                                setImages((prevImages) => {
                                                                    const updatedImages = [...prevImages, { url }];
                                                                    // Defer the form update to the next tick so it's not in the same render phase
                                                                    setTimeout(() => {
                                                                        field.onChange(updatedImages);
                                                                    }, 0);
                                                                    return updatedImages;
                                                                });
                                                            }}
                                                            onRemove={(url) =>
                                                                field.onChange([
                                                                    ...field.value.filter(
                                                                        (current) => current.url !== url
                                                                    ),
                                                                ])
                                                            }
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        );
                                    }}
                                />
                                {/* Colors */}
                                <div className="w-full flex flex-col gap-y-3 xl:pl-5">
                                    <ClickToAddInputs
                                        details={data?.colors || colors}
                                        setDetails={setColors}
                                        initialDetail={{ color: "" }}
                                        header="Colors"
                                        colorPicker
                                    />
                                    {errors.colors && (
                                        <span className="text-sm font-medium text-destructive">
                                            {errors.colors.message}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {/* Name */}
                            <InputFieldset label="Name">
                                <div className="flex flex-col lg:flex-row gap-4">
                                    {!isNewVariantPage && (
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input placeholder="Product name" {...field} disabled={isLoading} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                    <FormField
                                        control={form.control}
                                        name="variantName"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input placeholder="Variant name" {...field} disabled={isLoading} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </InputFieldset>
                            {/* Product and variant description editors (tabs) */}
                            <InputFieldset
                                label="Description"
                                description={
                                    isNewVariantPage
                                        ? ""
                                        : "Note: The product description is the main description for the product (Will display in every variant page). You can add an extra description specific to this variant using 'Variant description' tab."
                                }
                            >
                                <Tabs
                                    defaultValue={isNewVariantPage ? "variant" : "product"}
                                    className="w-full"
                                >
                                    {!isNewVariantPage && (
                                        <TabsList className="w-full grid grid-cols-2">
                                            <TabsTrigger value="product">
                                                Product description
                                            </TabsTrigger>
                                            <TabsTrigger value="variant">
                                                Variant description
                                            </TabsTrigger>
                                        </TabsList>
                                    )}
                                    <TabsContent value="product">
                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <div className={isLoading ? "hidden" : ""}>
                                                            <JoditEditor
                                                                ref={productDescEditor}
                                                                config={config}
                                                                value={form.getValues().description}
                                                                onBlur={(content) => {
                                                                    form.setValue("description", content);
                                                                }}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TabsContent>
                                    <TabsContent value="variant">
                                        <FormField
                                            control={form.control}
                                            name="variantDescription"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <div className={isLoading ? "hidden" : ""}>
                                                            <JoditEditor
                                                                ref={variantDescEditor}
                                                                config={config}
                                                                value={form.getValues().variantDescription || ""}
                                                                onBlur={(content) => {
                                                                    form.setValue("variantDescription", content);
                                                                }}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TabsContent>
                                </Tabs>
                            </InputFieldset>
                            {/* Variant Image - Keywords*/}
                            <div className="flex items-center gap-10 py-14">
                                {/* Variant image */}
                                <div className="border-r pr-10">
                                    <FormField
                                        control={form.control}
                                        name="variantImage"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="ml-14">Variant Image</FormLabel>
                                                <FormControl>
                                                    <ImageUpload
                                                        dontShowPreview
                                                        type="profile"
                                                        value={field.value.map((image) => image.url)}
                                                        disabled={isLoading}
                                                        onChange={(url) => field.onChange([{ url }])}
                                                        onRemove={(url) =>
                                                            field.onChange([
                                                                ...field.value.filter(
                                                                    (current) => current.url !== url
                                                                ),
                                                            ])
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage className="!mt-4" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Keywords */}
                                <div className="w-full flex-1 space-y-3">
                                    <FormField
                                        control={form.control}
                                        name="keywords"
                                        render={({ field }) => (
                                            <FormItem className="relative flex-1">
                                                <FormLabel>Product Keywords</FormLabel>
                                                <FormControl>
                                                    <ReactTags
                                                        handleAddition={handleAddition}
                                                        handleDelete={() => { }}
                                                        placeholder="Keywords (e.g., winter jacket) — press Enter to add"
                                                        classNames={{
                                                            tagInputField:
                                                                "bg-background border rounded-md p-2 w-full focus:outline-none",
                                                        }}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex flex-wrap gap-1">
                                        {keywords.map((k, i) => (
                                            <div
                                                key={i}
                                                className="text-xs inline-flex items-center px-3 py-1 bg-blue-200 text-blue-700 rounded-full gap-x-2"
                                            >
                                                <span>{k}</span>
                                                <span
                                                    className="cursor-pointer"
                                                    onClick={() => handleDeleteKeyword(i)}
                                                >
                                                    x
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* Sizes*/}
                            <InputFieldset label="Sizes, Quantities, Prices, Disocunts">
                                <div className="w-full flex flex-col gap-y-3">
                                    <ClickToAddInputs
                                        details={sizes}
                                        setDetails={setSizes}
                                        initialDetail={{
                                            size: "",
                                            quantity: 1,
                                            price: 0.01,
                                            discount: 0,
                                        }}
                                        containerClassName="flex-1"
                                        inputClassName="w-full"
                                    />
                                    {errors.sizes && (
                                        <span className="text-sm font-medium text-destructive">
                                            {errors.sizes.message}
                                        </span>
                                    )}
                                </div>
                            </InputFieldset>
                            {/* Product and variant specs*/}
                            <InputFieldset
                                label="Specifications"
                                description={
                                    isNewVariantPage
                                        ? ""
                                        : "Note: The product specifications are the main specs for the product (Will display in every variant page). You can add extra specs specific to this variant using 'Variant Specifications' tab. (But at least add one spec for product and variant.)"
                                }
                                className="w-1/2"
                            >
                                <Tabs
                                    defaultValue={
                                        isNewVariantPage ? "variantSpecs" : "productSpecs"
                                    }
                                >
                                    {!isNewVariantPage && (
                                        <TabsList className="w-full grid grid-cols-2">
                                            <TabsTrigger value="productSpecs">
                                                Product Specifications
                                            </TabsTrigger>
                                            <TabsTrigger value="variantSpecs">
                                                Variant Specifications
                                            </TabsTrigger>
                                        </TabsList>
                                    )}
                                    <TabsContent value="productSpecs">
                                        <div className="w-full flex flex-col gap-y-3">
                                            <ClickToAddInputs
                                                details={productSpecs}
                                                setDetails={setProductSpecs}
                                                initialDetail={{
                                                    name: "",
                                                    value: "",
                                                }}
                                                containerClassName="flex-1"
                                                inputClassName="w-full"
                                            />
                                            {errors.product_specs && (
                                                <span className="text-sm font-medium text-destructive">
                                                    {errors.product_specs.message}
                                                </span>
                                            )}
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="variantSpecs">
                                        <div className="w-full flex flex-col gap-y-3">
                                            <ClickToAddInputs
                                                details={variantSpecs}
                                                setDetails={setVariantSpecs}
                                                initialDetail={{
                                                    name: "",
                                                    value: "",
                                                }}
                                                containerClassName="flex-1"
                                                inputClassName="w-full"
                                            />
                                            {errors.variant_specs && (
                                                <span className="text-sm font-medium text-destructive">
                                                    {errors.variant_specs.message}
                                                </span>
                                            )}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </InputFieldset>
                            {/* Category - SubCategory - offer*/}
                            {!isNewVariantPage && (
                                <InputFieldset label="Category">
                                    <div className="flex gap-4">
                                        <FormField
                                            control={form.control}
                                            name="categoryId"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <Select
                                                        disabled={isLoading || categories.length == 0}
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue
                                                                    defaultValue={field.value}
                                                                    placeholder="Select a category"
                                                                />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {categories.map((category) => (
                                                                <SelectItem
                                                                    key={category.id}
                                                                    value={category.id}
                                                                >
                                                                    {category.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="subCategoryId"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <Select
                                                        disabled={
                                                            isLoading ||
                                                            categories.length == 0 ||
                                                            !form.getValues().categoryId
                                                        }
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue
                                                                    defaultValue={field.value}
                                                                    placeholder="Select a sub-category"
                                                                />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {subCategories.map((sub) => (
                                                                <SelectItem key={sub.id} value={sub.id}>
                                                                    {sub.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        {/* Offer Tag */}
                                        <FormField
                                            control={form.control}
                                            name="offerTagId"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <Select
                                                        disabled={isLoading || categories.length == 0}
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue
                                                                    defaultValue={field.value}
                                                                    placeholder="Select an offer"
                                                                />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {offerTags &&
                                                                offerTags.map((offer) => (
                                                                    <SelectItem key={offer.id} value={offer.id}>
                                                                        {offer.name}
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </InputFieldset>
                            )}
                            {/* Brand, Sku */}
                            <InputFieldset
                                label={isNewVariantPage ? "Sku" : "Brand, Sku"}
                            >
                                <div className="flex flex-col lg:flex-row gap-4">
                                    {!isNewVariantPage && (
                                        <FormField
                                            control={form.control}
                                            name="brand"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input placeholder="Product brand" {...field} disabled={isLoading} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                    <FormField
                                        control={form.control}
                                        name="sku"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input placeholder="Product sku" {...field} disabled={isLoading} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </InputFieldset>
                            {/* Questions*/}
                            {!isNewVariantPage && (
                                <InputFieldset label="Questions & Answers">
                                    <div className="w-full flex flex-col gap-y-3">
                                        <ClickToAddInputs
                                            details={questions}
                                            setDetails={setQuestions}
                                            initialDetail={{
                                                question: "",
                                                answer: "",
                                            }}
                                            containerClassName="flex-1"
                                            inputClassName="w-full"
                                        />
                                        {errors.questions && (
                                            <span className="text-sm font-medium text-destructive">
                                                {errors.questions.message}
                                            </span>
                                        )}
                                    </div>
                                </InputFieldset>
                            )}
                            {/* Is On Sale */}
                            <InputFieldset
                                label="Sale"
                                description="Is your product on sale ?"
                            >
                                <div>
                                    <label
                                        htmlFor="yes"
                                        className="ml-5 flex items-center gap-x-2 cursor-pointer"
                                    >
                                        <FormField
                                            control={form.control}
                                            name="isSale"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <div>
                                                            <input
                                                                type="checkbox"
                                                                id="yes"
                                                                checked={field.value}
                                                                onChange={field.onChange}
                                                                hidden
                                                            />
                                                            <Checkbox
                                                                checked={field.value}
                                                                // @ts-ignore
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <span>Yes</span>
                                    </label>
                                    {form.getValues().isSale && (
                                        <div className="mt-5">
                                            <p className="text-sm text-main-secondary dark:text-gray-400 pb-3 flex">
                                                <Dot className="-me-1" />
                                                When sale does end ?
                                            </p>
                                            <div className="flex items-center gap-x-5">
                                                <FormField
                                                    control={form.control}
                                                    name="saleEndDate"
                                                    render={({ field }) => (
                                                        <FormItem className="ml-4">
                                                            <FormControl>
                                                                <DateTimePicker
                                                                    className="inline-flex items-center gap-2 p-2 border rounded-md shadow-sm"
                                                                    calendarIcon={
                                                                        <span className="text-gray-500 hover:text-gray-600">
                                                                            📅
                                                                        </span>
                                                                    }
                                                                    clearIcon={
                                                                        <span className="text-gray-500 hover:text-gray-600">
                                                                            ✖️
                                                                        </span>
                                                                    }
                                                                    onChange={(date) => {
                                                                        field.onChange(
                                                                            date
                                                                                ? format(date, "yyyy-MM-dd'T'HH:mm:ss")
                                                                                : ""
                                                                        );
                                                                    }}
                                                                    value={
                                                                        field.value ? new Date(field.value) : null
                                                                    }
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <ArrowRight className="w-4 text-[#1087ff]" />
                                                <span>{formattedDate}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </InputFieldset>
                            <div className="text-red-500 text-sm font-medium">
                                {Object.values(errors)[0]?.message || ""}
                            </div>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading
                                    ? "loading..."
                                    : data?.productId && data.variantId
                                        ? "Save product information"
                                        : "Create product"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card >
        </AlertDialog >
    );
};

export default ProductDetails;
