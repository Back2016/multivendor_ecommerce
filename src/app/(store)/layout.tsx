// React
import { ReactNode } from "react";

import "@fortawesome/fontawesome-free/css/all.min.css";

// Components
import Header from "@/components/store/layout/header/header";
import CategoriesHeader from "@/components/store/layout/categories-header/categories-header";
import Footer from "@/components/store/layout/footer/footer";

export default function StoreLayout({ children } : { children: ReactNode}) {
  return (
    <div>
        <div><Header/></div>
        <CategoriesHeader />
        <div className="h-170">{children}</div>
        <div className="w-full"><Footer/></div>
    </div>
  )
}
