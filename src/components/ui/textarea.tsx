import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground border-input flex min-h-24 w-full min-w-0 rounded-md border-[1.5px] bg-card px-3.5 py-2.5 text-base text-ink transition-[border-color,box-shadow] hover:border-ink/40 outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ink focus-visible:ring-4 focus-visible:ring-acid",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/15",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
