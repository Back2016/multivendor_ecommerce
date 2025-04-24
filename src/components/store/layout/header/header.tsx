import Link from "next/link";
// import icon from "../../../../../public/assets/icons/logo-6.png"
// import Image from "next/image";
import UserMenu from "./user-menu/user-menu";
import Cart from "./cart";
import DownloadApp from "./download-app";
import Search from "./search/search";
import ThemeToggle from "@/components/shared/ThemeToggle";

// NextJS
import { cookies } from "next/headers";
import { Country } from "@/lib/types";
import CountryLanguageCurrencySelector from "./country-lang-curr-selector";

export default async function Header() {
    // Get cookies from the store
    const cookieStore = await cookies();
    const userCountryCookie = cookieStore.get("userCountry");

    // Set default country if cookie is missing
    let userCountry: Country = {
        name: "United States",
        city: "",
        code: "US",
        region: "",
    };

    // console.log(userCountryCookie);

    // If cookie exists, update the user country
    if (userCountryCookie) {
        userCountry = JSON.parse(userCountryCookie.value) as Country;
    }

    return (
        <div className="bg-gradient-to-r from-slate-400 to-slate-800">
            <div className="h-full w-full lg:flex text-white px-4 lg:px-8">
                <div className="flex lg:w-full lg:flex-1 flex-col lg:flex-row gap-3 py-3">
                    <div className="flex items-center justify-between">
                        <Link href="/">
                            <h1 className="font-extrabold text-3xl font-mono">Go<p className="text-blue-600 inline">Shop</p></h1>
                            {/* <Image
                                src={icon}
                                alt="icon image"
                                width={150}
                                height={150} /> */}
                        </Link>
                        <div className="flex lg:hidden">
                            <UserMenu />
                            <Cart />
                            <ThemeToggle />
                        </div>
                    </div>
                    <Search />
                </div>
                <div className="hidden lg:flex lg:items-center w-full lg:w-fit lg:mt-2 justify-end mt-1.5 pl-6">
                    <div className="lg:flex">
                        <DownloadApp />
                    </div>
                    <CountryLanguageCurrencySelector userCountry={userCountry} />
                    <UserMenu />
                    <Cart />
                    <div className="ml-3">
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </div>
    );
}
