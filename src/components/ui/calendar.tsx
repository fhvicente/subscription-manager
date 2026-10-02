"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex h-8 items-center justify-center",
        caption_label: "text-sm font-bold tracking-tight",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-8"),
        button_next: cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-8"),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-[0.75rem] font-semibold text-muted-foreground",
        week: "mt-1 flex w-full",
        day: "relative size-9 p-0 text-center text-sm",
        day_button:
          "size-9 cursor-pointer rounded-full font-medium tabular-nums transition-colors hover:bg-ink/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink",
        selected: "[&>button]:bg-ink [&>button]:text-paper [&>button]:hover:bg-ink",
        today: "[&>button]:bg-acid [&>button]:text-ink",
        outside: "text-muted-foreground/50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight
          return <Icon className={cn("size-4", className)} />
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
