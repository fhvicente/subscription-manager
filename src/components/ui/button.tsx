import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-tight cursor-pointer transition-[background-color,color,border-color,transform] duration-300 ease-out-expo active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-ink text-paper hover:bg-acid hover:text-ink",
        acid: "bg-acid text-ink hover:bg-ink hover:text-acid",
        destructive: "bg-destructive text-paper hover:bg-ink",
        outline:
          "border-[1.5px] border-ink bg-transparent text-ink hover:bg-ink hover:text-paper",
        secondary: "bg-paper-2 text-ink hover:bg-acid",
        ghost: "text-ink hover:bg-ink/[0.06]",
        link: "rounded-none px-0 text-ink underline decoration-[1.5px] underline-offset-4 hover:decoration-acid hover:decoration-[3px]",
      },
      size: {
        default: "h-10 px-5 has-[>svg]:px-4",
        sm: "h-8 gap-1.5 px-3.5 text-[13px] has-[>svg]:px-3",
        lg: "h-12 px-7 text-base has-[>svg]:px-6",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
