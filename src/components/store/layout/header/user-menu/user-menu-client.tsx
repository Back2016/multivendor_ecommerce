"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton, SignOutButton } from "@clerk/nextjs";
import { MessageIcon, OrderIcon, WishlistIcon } from "@/components/store/icons";
import { Button } from "@/components/store/ui/button";
import { Separator } from "@/components/ui/separator";

// ----------------------------------------------------------------------------
// Props coming from the server wrapper
// ----------------------------------------------------------------------------
type SafeUser =
    | null
    | { id: string; fullName: string | null; imageUrl: string };

export default function UserMenuClient({ user }: { user: SafeUser }) {
    const [open, setOpen] = useState(false);                // mobile toggler
    const ref = useRef<HTMLDivElement>(null);

    // ––––– click-outside handler (mobile only) –––––
    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node))
                setOpen(false);
        };
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, [open]);

    // ––––– trigger tap (only < lg) –––––
    const handleTriggerClick = useCallback(() => {
        if (window.matchMedia("(max-width: 1023px)").matches) { // lg breakpoint
            setOpen((prev) => !prev);
        }
    }, []);

    return (
        <div ref={ref} className="relative group">
            {/* ▸ trigger ------------------------------------------------------------ */}
            <div onClick={handleTriggerClick} className="cursor-pointer select-none">
                {user ? (
                    <Image
                        src={user.imageUrl}
                        alt={user.fullName!}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                    />
                ) : (
                    <div className="flex h-11 items-center mx-2">
                        <span className="text-2xl">
                            <UserIcon />
                        </span>
                        <div className="ml-1 leading-none">
                            <span className="block text-xs text-white">Welcome</span>
                            <b className="flex items-center gap-0.5 text-xs text-white">
                                Sign in / Register
                                <ChevronDown className="scale-75" />
                            </b>
                        </div>
                    </div>
                )}
            </div>

            {/* ▸ dropdown ----------------------------------------------------------- */}
            <div
                className={cn(
                    "absolute lg:top-0 top-full mt-1 transition-all duration-150",
                    /* CLOSED  */ !open && "opacity-0 scale-95 pointer-events-none",
                    /* OPEN    */  open && "opacity-100 scale-100 pointer-events-auto",
                    /* DESKTOP */ "lg:group-hover:opacity-100 lg:group-hover:scale-100 lg:group-hover:pointer-events-auto",
                    /* z-index */
                    "z-50",
                    /* --- horizontal position --------------------------------------------- */
                    { "-left-20": !user },                          // guest view (avatar + text)
                    { "-left-[200px] lg:-left-[148px]": user }      // logged-in (avatar only)
                )}
            >
                <div className="relative left-2 mt-10 z-40 pt-2.5 text-sm">
                    {/* little triangle */}
                    <div className="absolute top-1 left-[149px] h-0 w-0
                          border-l-[10px] border-r-[10px] border-b-[10px]
                          border-l-transparent border-r-transparent border-b-white" />

                    {/* menu card */}
                    <div className="w-[305px] rounded-3xl bg-white text-[var(--usermenu-text)] shadow-lg">
                        <div className="px-6 pt-5">
                            {user ? (
                                <div className="flex flex-col items-center">
                                    <UserButton />
                                    <p className="my-3 text-[var(--main-primary)] cursor-pointer">
                                        <SignOutButton />
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1 text-center">
                                    <Link href="/sign-in">
                                        <Button>Sign in</Button>
                                    </Link>
                                    <Link href="/sign-up" className="text-[var(--main-primary)] hover:underline">
                                        Register
                                    </Link>
                                </div>
                            )}
                            <Separator className="mt-4" />
                        </div>

                        {/* quick links */}
                        <div className="max-h-[calc(100vh-180px)] overflow-y-auto p-4 pt-2">
                            <ul className="grid grid-cols-3 gap-4 mb-3">
                                {links.map(({ icon, title, link }) => (
                                    <li key={title} className="text-center">
                                        <Link href={link} className="space-y-2 inline-block">
                                            <div className="grid h-14 w-14 place-items-center rounded-full bg-[var(--gray-light)] hover:bg-gray-200 p-2">
                                                {icon}
                                            </div>
                                            <span className="block text-xs">{title}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            <Separator className="!max-w-[257px] mx-auto" />
                            <ul className="mt-2 space-y-1">
                                {extraLinks.map(({ title, link }, idx) => (
                                    <li key={idx}>
                                        <Link href={link} className="block text-sm text-[var(--main-primary)] hover:underline">
                                            {title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// Static data (unchanged from your snippet)
// ────────────────────────────────────────────────────────────────────────────
const links = [
    { icon: <OrderIcon />, title: "My Orders", link: "/profile/orders" },
    { icon: <MessageIcon />, title: "Messages", link: "/profile/messages" },
    { icon: <WishlistIcon />, title: "WishList", link: "/profile/wishlist" },
];

const extraLinks = [
    { title: "Profile", link: "/profile" },
    { title: "Settings", link: "/" },
    { title: "Become a Seller", link: "/become-seller" },
    { title: "Help Center", link: "" },
    { title: "Return & Refund Policy", link: "/" },
    { title: "Legal & Privacy", link: "" },
    { title: "Discounts & Offers", link: "" },
    { title: "Order Dispute Resolution", link: "" },
    { title: "Report a Problem", link: "" },
];
