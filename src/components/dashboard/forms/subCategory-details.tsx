"use client";

// Prisma model
import { Category, SubCategory } from "@prisma/client";

// React
import { FC, useEffect } from "react";

// Form handling utilities
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Schema
import { SubCategoryFormSchema } from "@/lib/schemas";

// Shadcn/ui
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

import ImageUpload from "../shared/image-upload";

// Queries
import { upsertSubCategory } from "@/queries/subCategory";

// Utils
import { v4 } from "uuid";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";



interface SubCategoryDetailsProps {
    data?: SubCategory;
    categories: Category[];
}

const SubCategoryDetails: FC<SubCategoryDetailsProps> = ({ data, categories }) => {
    const router = useRouter(); // Hook for routing

    // Form hook for managing form state and validation
    const form = useForm<z.infer<typeof SubCategoryFormSchema>>({
        mode: "onChange", // Form validation mode
        resolver: zodResolver(SubCategoryFormSchema), // Resolver for form validation
        defaultValues: {
            // Set default values from data (if available)
            name: data?.name ?? "",
            image: data?.image ? [{ url: data?.image }] : [],
            url: data?.url,
            featured: data?.featured ?? false,
            categoryId: data?.categoryId ?? "",
        }
    });

    // Loading status based on form submission
    const isLoading = form.formState.isSubmitting;

    // const formData = form.watch();
    // console.log("formData", formData);

    // Always show latest data
    useEffect(() => {
        if (data) {
            form.reset({
                name: data?.name,
                image: [{ url: data?.image }],
                url: data?.url,
                featured: data?.featured,
                categoryId: data?.categoryId,
            })
        }
    }, [data, form]);

    // Submit handler for form submission
    const handleSubmit = async (values: z.infer<typeof SubCategoryFormSchema>) => {
        // console.log("VALUES SENT TO SERVER", values); // Debuging line
        try {
            // Upserting category data
            const response = await upsertSubCategory({
                id: data?.id ? data.id : v4(),
                name: values.name,
                image: values.image[0].url,
                url: values.url,
                featured: values.featured ?? false,
                categoryId: values.categoryId ?? "",
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            toast(data?.id
                ? "subCategory has been updated."
                : `Congratulations! '${response?.name}' is now created.`);

            // Redirect or Refresh data
            if (data?.id) {
                router.refresh();
            } else {
                router.push("/dashboard/admin/subCategories");
            }
        } catch (error: any) {
            // Handling form submission errors
            console.log(error);
            toast.error("Oops!", {
                description: error.toString(),
            });
        }
    }

    return (
        <AlertDialog>
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Sub-Category Information</CardTitle>
                    <CardDescription>
                        {data?.id
                            ? `Update ${data?.name} SubCategory information.`
                            : " Lets create a subCategory. You can edit subCategory later from the subCategories table or the subCategory page."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(handleSubmit)}
                            className="space-y-4"
                        >
                            <FormField
                                control={form.control}
                                name="image"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <ImageUpload
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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Sub-Category name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Name" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="url"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Sub-Category url</FormLabel>
                                        <FormControl>
                                            <Input placeholder="/subCategory-url" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Category</FormLabel>
                                        <Select
                                            disabled={isLoading || categories.length == 0}
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue defaultValue={field.value} placeholder="Select a category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {
                                                    categories.map((category) => (
                                                        <SelectItem
                                                            key={category.id}
                                                            value={category.id}
                                                            >
                                                            {category.name}
                                                        </SelectItem>
                                                    ))
                                                }
                                            </SelectContent>
                                        </Select>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="featured"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                // @ts-ignore
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Featured</FormLabel>
                                            <FormDescription>
                                                This Category will appear on the home page
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isLoading}>
                                {isLoading
                                    ? "loading..."
                                    : data?.id
                                        ? "Save Sub-Category information"
                                        : "Create Sub-Category"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </AlertDialog>
    );
};

export default SubCategoryDetails;
