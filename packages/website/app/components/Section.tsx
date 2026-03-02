import { cn } from "@/lib/utils"

interface SectionProps {
  id?: string
  children: React.ReactNode
  className?: string
}

export function Section({ id, children, className }: SectionProps) {
  return (
    <section id={id} className={cn("py-24 sm:py-32", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  )
}

interface SectionHeaderProps {
  badge?: string
  title: string
  description?: string
  className?: string
}

export function SectionHeader({ badge, title, description, className }: SectionHeaderProps) {
  return (
    <div className={cn("text-center", className)}>
      {badge && (
        <div className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-primary">
          {badge}
        </div>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}
