// DB
import StoreDetails from "@/components/dashboard/forms/store-details";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function SellerStoreSettingsPage({ params, } : { params: {storeUrl: string};}) {
  const paramsObj = await params;
  // console.log("params ---> ", paramsObj);

  const storeDetails = await db.store.findUnique({
    where: {
      url: paramsObj.storeUrl,
    }
  });

  if (!storeDetails) redirect("/dashboard/seller/stores");

  return (
    <div><StoreDetails data={storeDetails}/></div>
  )
}
