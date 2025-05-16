
import * as React from "react"

import { cn } from "@/lib/utils"
import { useThemeStyles } from "@/hooks/use-theme-styles"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => {
  const borderStyles = useThemeStyles({
    light: "border border-border",
    dark: "border border-border",
    base: "w-full caption-bottom text-sm"
  });

  return (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn(borderStyles, className)}
        {...props}
      />
    </div>
  );
})
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  const headerStyles = useThemeStyles({
    light: "[&_tr]:border-b [&_tr]:border-border",
    dark: "[&_tr]:border-b [&_tr]:border-border",
    base: ""
  });

  return (
    <thead ref={ref} className={cn(headerStyles, className)} {...props} />
  );
})
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  const footerStyles = useThemeStyles({
    light: "border-t border-border bg-muted/50 font-medium",
    dark: "border-t border-border bg-muted/30 font-medium",
    base: "[&>tr]:last:border-b-0"
  });

  return (
    <tfoot
      ref={ref}
      className={cn(footerStyles, className)}
      {...props}
    />
  );
})
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => {
  const rowStyles = useThemeStyles({
    light: "border-b border-border hover:bg-muted/50",
    dark: "border-b border-border hover:bg-muted/30",
    base: "transition-colors data-[state=selected]:bg-muted"
  });

  return (
    <tr
      ref={ref}
      className={cn(rowStyles, className)}
      {...props}
    />
  );
})
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
