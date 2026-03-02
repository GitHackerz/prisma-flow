import Link from "next/link"
import { Database, Github, Heart } from "lucide-react"

const footerLinks = {
  Product: [
    { label: "Features",     href: "/#features" },
    { label: "Installation", href: "/#installation" },
    { label: "CLI Reference", href: "/#cli" },
    { label: "Pricing",      href: "/#pricing" },
  ],
  Resources: [
    { label: "Documentation", href: "/docs" },
    { label: "API Reference", href: "/docs#api-reference" },
    { label: "CI/CD Guide",   href: "/docs#cicd-integration" },
    { label: "Docker",        href: "/docs#docker" },
  ],
  Community: [
    { label: "GitHub",        href: "https://github.com/GitHackerz/prisma-flow", external: true },
    { label: "Contributing",  href: "https://github.com/GitHackerz/prisma-flow/blob/main/CONTRIBUTING.md", external: true },
    { label: "Changelog",     href: "https://github.com/GitHackerz/prisma-flow/blob/main/CHANGELOG.md", external: true },
    { label: "License (MIT)", href: "https://github.com/GitHackerz/prisma-flow/blob/main/LICENSE", external: true },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 font-semibold text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Database className="h-4.5 w-4.5 text-primary" />
              </div>
              <span>
                Prisma<span className="text-primary">Flow</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground leading-relaxed">
              Visual Prisma migration management. Detect drift, analyse risks, and ship database changes safely.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://github.com/GitHackerz/prisma-flow"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Link groups */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {"external" in link ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} PrismaFlow. Released under the MIT License.
          </p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            Built with <Heart className="h-3.5 w-3.5 text-red-500" /> for the Prisma community
          </p>
        </div>
      </div>
    </footer>
  )
}
