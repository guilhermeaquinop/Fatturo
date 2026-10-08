// Link de texto (cor link, 600, sublinhado), para navegação dentro do app.
// Equivale a um <x-link> do Blade; usa o <Link> do Next, que navega sem recarregar a página.
import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const textLinkClassName = "font-semibold text-link underline hover:text-brand-deep"

function TextLink({ className, ...props }: React.ComponentProps<typeof Link>) {
  return <Link className={cn(textLinkClassName, className)} {...props} />
}

export { TextLink, textLinkClassName }
