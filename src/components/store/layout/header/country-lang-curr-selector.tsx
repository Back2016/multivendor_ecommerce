"use client";

// React, Next.js
import { useState, useTransition } from "react";

// Icons
import "/node_modules/flag-icons/css/flag-icons.min.css";
import { ChevronDown } from "lucide-react";

// Types
import { Country, SelectMenuOption } from "@/lib/types";

// Country selector
import CountrySelector from "@/components/shared/country-selector";

// countries data
import countries from "@/data/countries.json";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

export default function CountryLanguageCurrencySelector({
  userCountry,
}: {
  userCountry: Country;
}) {
  // Router hook for navigation
  const router = useRouter();

  // State to manage countries dropdown visibility and applied optimistic updating
  const [currentCountry, setCurrentCountry] = useState<Country>(userCountry);
  const [isSaving, setIsSaving] = useState(false);
  const [_, startTransition] = useTransition();
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const handleCountryClick = async (countryName: string) => {
    if (isSaving) return;                        // 1) ignore while saving

    const countryData = countries.find((c) => c.name === countryName);
    if (!countryData) return;

    const nextCountry: Country = {
      name: countryData.name,
      code: countryData.code,
      city: "",
      region: "",
    };

    const previousCountry = currentCountry;      // keep for rollback
    setCurrentCountry(nextCountry);              // optimistic UI
    setIsSaving(true);

    try {
      const res = await fetch("/api/setUserCountryInCookies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userCountry: nextCountry }),
      });
      if (!res.ok) throw new Error("Network error");

      startTransition(() => router.refresh());
    } catch (err) {
      setCurrentCountry(previousCountry);       // roll back if failed
      console.error("Failed to set country:", err);
      toast.error("Could not update country");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative inline-block group">
      {/* Trigger */}
      <div>
        <div className="flex items-center h-11 py-0 px-2 cursor-pointer">
          <span className="mr-0.5  h-[33px] grid place-items-center">
            <span className={`fi fi-${currentCountry.code.toLowerCase()}`} />
          </span>
          <div className="ml-1">
            <span className="block text-xs text-white leading-3 mt-2">
            {currentCountry.name}/EN/
            </span>
            <b className="text-xs font-bold text-white ">
              USD
              <span className="text-white scale-[60%] align-middle inline-block">
                <ChevronDown />
              </span>
            </b>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="absolute hidden top-0 group-hover:block cursor-pointer">
        <div className="relative mt-12 -ml-32 w-[300px]  bg-white rounded-[24px] text-[var(--main-primary)] pt-2 px-6 pb-6 z-50 shadow-lg">
          {/* Triangle */}
          <div className="w-0 h-0 absolute -top-1.5 right-24 border-l-[10px] border-l-transparent border-b-[10px] border-white border-r-[10px] border-r-transparent" />
          <div className="mt-4 leading-6 text-[20px] font-bold">Ship to</div>
          <div className="mt-2">
            <div className="relative text-[var(--main-primary)] bg-white rounded-lg">
              <CountrySelector
                id={"countries"}
                open={isSelectorOpen}
                onToggle={() => setIsSelectorOpen(!isSelectorOpen)}
                onChange={(val) => handleCountryClick(val)}
                selectedValue={
                  (countries.find(
                    (option) => option.name === currentCountry.name
                  ) as SelectMenuOption) || countries[0]
                }
              />
              <div>
                <div className="mt-4 leading-6 text-[20px] font-bold">
                  Language
                </div>
                <div className="relative mt-2.5 h-10 py-0 px-3 border-[1px] border-black/20 rounded-lg  flex items-center cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap">
                  <div className="align-middle">English (*demo project)</div>
                  <span className="absolute right-2">
                    <ChevronDown className="text-[var(--main-primary)] scale-75" />
                  </span>
                </div>
              </div>
              <div>
                <div className="mt-4 leading-6 text-[20px] font-bold">
                  Currency
                </div>
                <div className="relative mt-2 h-10 py-0 px-3 border-[1px] border-black/20 rounded-lg  flex items-center cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap">
                  <div className="align-middle">USD (*demo project) </div>
                  <span className="absolute right-2">
                    <ChevronDown className="text-[var(--main-primary)] scale-75" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
