// header
import Header from "@/components/dashboard/header/header";
// sidebar
import Sidebar from "@/components/dashboard/sidebar/sidebar";

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function AdminDashboardLayout({ children }: { children: ReactNode; }) {
    // Block non admins from accessing this route
    const user = await currentUser();
    if (!user || user?.privateMetadata.role !== "ADMIN") redirect("/");

    return (
        <div className="w-full h-full">
            {/* Sidebar */}
            <Sidebar isAdmin/>
            <div className="w-full ml-[300px]">
                {/* Header */}
                <Header />
                <div className="w-full mt-[75px] p-4">
                    {children}
                </div>
            </div>
        </div>
    )
}
