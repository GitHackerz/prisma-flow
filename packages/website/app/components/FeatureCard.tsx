import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  className?: string
  iconColor?: string
}

export function FeatureCard({ icon: Icon, title, description, className, iconColor = "text-primary" }: FeatureCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border/50 bg-card/50 p-6 transition-all hover:border-border hover:bg-card",
        className
      )}
    >
      <div className={cn("mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10", iconColor === "text-emerald-400" && "bg-emerald-500/10", iconColor === "text-amber-400" && "bg-amber-500/10", iconColor === "text-sky-400" && "bg-sky-500/10")}>
        <Icon className={cn("h-5.5 w-5.5", iconColor)} />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
