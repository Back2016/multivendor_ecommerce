import { cn } from "@/lib/utils";
import { OfferTag } from "@prisma/client";
import Link from "next/link";
import { useMediaQuery } from "react-responsive";

export default function OfferTagsLinks({
    offerTags,
    open,
}: {
    offerTags: OfferTag[];
    open: boolean;
}) {
    // To show different number of tags based on screen size
    // breakpoints is an array of objects with:
    // name: label for the screen
    // query: media query string
    // value: how many tags to show on that screen size
    // .reduce(...) walks through each breakpoint and decides whether the query matches the current screen.
    // matchMedia('(min-width: 768px)') will return true for any width ≥ 768px (so 2000px will be true for all the bps)
    // If it matches, it updates acc (the result) to that value.
    // If not, it keeps the previous result.
    // The starting value is 1, which acts as a fallback for the smallest screens (or when no queries match).
    const useBreakpoints = () => {
        const splitPoint = breakpoints.reduce((acc, bp) => {
            const matches = useMediaQuery({ query: bp.query });
            return matches ? bp.value : acc;
        }, 1);
        return splitPoint;
    };
    const splitPoint = useBreakpoints();

    return (
        <div className="relative w-fit">
            <div
                className={cn(
                    "flex items-center flex-wrap xl:-translate-x-6 transition-all duration-100 ease-in-out",
                    {
                        "!translate-x-0": open,
                    }
                )}
            >
                {offerTags.slice(0, splitPoint).map((tag, i) => (
                    <Link
                        key={tag.id}
                        href={`/browse?offer=${tag.url}`}
                        className={cn(
                            "font-bold text-center text-white px-4 leading-10 rounded-[20px] hover:bg-[#ffffff33]",
                            {
                                "text-[var(--orange-background)]": i === 0,
                            }
                        )}
                    >
                        {tag.name}
                    </Link>
                ))}
            </div>
        </div>
    );
}

const breakpoints = [
    { name: "isPhoneScreen", query: "(max-width: 640px)", value: 2 }, // mobile devices
    { name: "isSmallScreen", query: "(min-width: 640px)", value: 3 }, // sm
    { name: "isMediumScreen", query: "(min-width: 768px)", value: 4 }, // md
    { name: "isLargeScreen", query: "(min-width: 1024px)", value: 6 }, // lg
    // { name: "isXLargeScreen", query: "(min-width: 1280px)", value: 6 }, // xl
    { name: "is2XLargeScreen", query: "(min-width: 1536px)", value: 7 }, // 2xl
];
