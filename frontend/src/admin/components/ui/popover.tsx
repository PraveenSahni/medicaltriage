import * as PopoverPrimitive from "@radix-ui/react-popover";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { useAdminPortalContainer } from "../AdminPortalProvider";
import { cn } from "../lib/utils";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export const PopoverContent = forwardRef<
  ElementRef<typeof PopoverPrimitive.Content>,
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "start", sideOffset = 4, ...props }, ref) => {
  const container = useAdminPortalContainer();
  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-64 rounded-md border border-border bg-card p-3 text-foreground shadow-md outline-none",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = "PopoverContent";
