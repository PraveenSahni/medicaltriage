import * as TabsPrimitive from "@radix-ui/react-tabs";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { cn } from "../lib/utils";

export const Tabs = TabsPrimitive.Root;

export const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn("flex items-stretch gap-1 overflow-x-auto border-b border-border", className)}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors",
      "hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-extrabold",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn("mt-3", className)} {...props} />
));
TabsContent.displayName = "TabsContent";
