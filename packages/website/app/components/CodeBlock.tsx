'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
  showLineNumbers?: boolean
}

export function CodeBlock({
  code,
  language = 'bash',
  filename,
  showLineNumbers = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lines = code.split('\n')

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-[hsl(224,71%,4%)]">
      {/* Header */}
      {(filename || language) && (
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-white/10" />
              <div className="h-3 w-3 rounded-full bg-white/10" />
              <div className="h-3 w-3 rounded-full bg-white/10" />
            </div>
            {filename && <span className="font-mono text-xs text-white/40">{filename}</span>}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-white/40 transition-colors hover:text-white/70"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      )}

      {/* Code */}
      <pre className="overflow-x-auto p-4">
        <code className={`font-mono text-sm leading-7 language-${language}`}>
          {lines.map((line, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: code block lines are static and never reorder
            <div key={`line-${i}`} className="flex">
              {showLineNumbers && (
                <span className="mr-6 inline-block w-5 text-right text-white/20 select-none">
                  {i + 1}
                </span>
              )}
              <span className="text-[#e2e8f0]">{line}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  )
}
