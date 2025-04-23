import StoreDefaultShippingDetails from "@/components/dashboard/forms/store-default-shipping-details";
import DataTable from "@/components/ui/data-table";
import { getStoreDefaultShippingDetails, getStoreShippingRates } from "@/queries/store"
import { redirect } from "next/navigation";
import { columns } from "./columns";

export default async function SellerStoreShippingPage({
  params,
}: {
  params: { storeUrl: string };
}) {
  const paramsObj = await params;
  const shippingDetails = await getStoreDefaultShippingDetails(paramsObj.storeUrl);
  const shippingRates = await getStoreShippingRates(paramsObj.storeUrl);
  if (!shippingDetails || !shippingRates) return redirect("/");

  return (
    <>
      <StoreDefaultShippingDetails data={shippingDetails} storeUrl={paramsObj.storeUrl} />
      <DataTable
        filterValue="countryName"
        data={shippingRates}
        columns={columns}
        searchPlaceholder="Search by country name..."
      />
    </>

  )
}
