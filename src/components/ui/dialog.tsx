import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("text-2xl font-bold tracking-tight", className)} {...props} />
));
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-[15px] leading-6 text-muted", className)} {...props} />
));
DialogDescription.displayName = "DialogDescription";

export const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    variant?: "modal" | "wide" | "drawer";
  }
>(({ className, children, variant = "modal", ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-[2px] duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 overflow-x-hidden overflow-y-auto border border-line bg-paper text-ink outline-none duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in",
        variant === "drawer"
          ? "bottom-0 left-auto right-0 top-0 w-[min(96vw,28rem)] rounded-l-[2rem] rounded-r-none border-r-0 p-6 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:bottom-3 sm:top-3 sm:p-7"
          : variant === "wide"
            ? "bottom-0 left-0 right-0 max-h-[96dvh] rounded-t-[28px] p-5 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:max-h-[92vh] sm:w-[min(96vw,72rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:p-7 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95"
            : "bottom-0 left-0 right-0 max-h-[92vh] rounded-t-[2rem] p-6 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:max-h-[86vh] sm:w-[min(92vw,46rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2rem] sm:p-8 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95",
        className,
      )}
      {...props}
    >
      <div className="pointer-events-none absolute right-4 top-4 z-30">
        <DialogPrimitive.Close
          aria-label="Close"
          className="focus-ring pointer-events-auto grid size-10 place-items-center rounded-full border border-line bg-paper/95 text-muted shadow-sm backdrop-blur transition-colors hover:bg-sand hover:text-ink"
        >
          <X className="size-5" aria-hidden />
        </DialogPrimitive.Close>
      </div>
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";
