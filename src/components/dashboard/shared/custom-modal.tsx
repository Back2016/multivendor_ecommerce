"use client";

// Provider
import { useModal } from "@/providers/modal-provider";

// UI
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// Utils
import { cn } from "@/lib/utils";

type Props = {
  heading?: string;
  subheading?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  maxWidth?: string;
};

const CustomModal = ({ children, defaultOpen, subheading, heading, maxWidth }: Props) => {
  const { isOpen, setClose } = useModal();

  console.log(maxWidth);
  return (
    <Dialog open={isOpen || defaultOpen} onOpenChange={setClose}>
      <DialogContent
        className={cn(
          "w-full !max-w-[90vw] md:!max-w-[1000px] max-h-[90vh] overflow-y-auto bg-card",
          maxWidth
        )}
      >
        <DialogHeader className="pt-8 text-left">
          {heading ? (
            <DialogTitle className="text-2xl font-bold">{heading}</DialogTitle>
          ) : (
            <VisuallyHidden>
              <DialogTitle>Modal</DialogTitle>
            </VisuallyHidden>
          )}
          {subheading && <DialogDescription>{subheading}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default CustomModal;
