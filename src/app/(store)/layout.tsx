// React
import { ReactNode } from "react";

import "@fortawesome/fontawesome-free/css/all.min.css";

// Components
import CategoriesHeader from "@/components/store/layout/categories-header/categories-header";


// Toaster
import { Toaster } from "react-hot-toast";

export default function StoreLayout({ children } : { children: ReactNode}) {
  return (
    <div>
        <div></div>
        <div className="h-170">{children}</div>
        <Toaster position="top-center" />
    </div>
  )
}
