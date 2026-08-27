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
  <DialogPrimitive.Description ref={ref} className={cn("text-sm leading-6 text-muted", className)} {...props} />
));
DialogDescription.displayName = "DialogDescription";

export const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { variant?: "modal" | "drawer" }
>(({ className, children, variant = "modal", ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/28 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 overflow-y-auto border border-line bg-paper text-ink outline-none",
        variant === "drawer"
          ? "inset-y-0 right-0 w-[min(92vw,28rem)] rounded-l-[2rem] p-6 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
          : "bottom-0 left-0 right-0 max-h-[92vh] rounded-t-[2rem] p-6 sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:max-h-[86vh] sm:w-[min(92vw,46rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2rem] sm:p-8",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        aria-label="Close"
        className="focus-ring absolute right-5 top-5 grid size-10 place-items-center rounded-full text-muted transition-colors hover:bg-sand hover:text-ink"
      >
        <X className="size-5" aria-hidden />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";
