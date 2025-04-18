import { FormLabel } from "@/components/ui/form";
import { Dot } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils"; // Assuming you're using `cn` or `clsx` utility

export default function InputFieldset({
  label,
  description,
  children,
  className,
}: {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string; // <- Add className here
}) {
  return (
    <div className={cn("w-full", className)}>
      <fieldset className="border rounded-md p-4">
        <legend className="px-2">
          <FormLabel>{label}</FormLabel>
        </legend>
        {description && (
          <p className="text-sm text-main-secondary dark:text-gray-400 pb-3 flex font-medium">
            <Dot className="-me-1" />
            {description}
          </p>
        )}
        {children}
      </fieldset>
    </div>
  );
}
