"use client"

import { useState, useEffect, useCallback } from "react"

const REVEAL_SECONDS = 30

export default function SecureCode({
  onReveal,
  label = "code",
}: {
  onReveal: () => Promise<string>
  label?: string
}) {
  const [state, setState] = useState<"hidden" | "loading" | "visible">("hidden")
  const [value, setValue] = useState("")
  const [countdown, setCountdown] = useState(REVEAL_SECONDS)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  const hide = useCallback(() => {
    setState("hidden")
    setValue("")
    setCountdown(REVEAL_SECONDS)
  }, [])

  useEffect(() => {
    if (state !== "visible") return
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); hide(); return REVEAL_SECONDS }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [state, hide])

  async function handleReveal() {
    setError("")
    setState("loading")
    try {
      const v = await onReveal()
      setValue(v)
      setState("visible")
      setCountdown(REVEAL_SECONDS)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reveal")
      setState("hidden")
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (state === "hidden") {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="font-mono text-sm text-gray-400 tracking-widest">••••••••</span>
        <button
          onClick={handleReveal}
          className="text-xs text-indigo-600 hover:underline font-medium"
        >
          Reveal {label}
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </span>
    )
  }

  if (state === "loading") {
    return <span className="text-xs text-gray-400">Loading…</span>
  }

  return (
    <span className="inline-flex items-center gap-2 flex-wrap">
      <span className="font-mono text-sm bg-yellow-50 border border-yellow-200 text-yellow-900 px-2 py-0.5 rounded select-all">
        {value}
      </span>
      <button
        onClick={handleCopy}
        className="text-xs text-gray-500 hover:text-gray-700"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <button onClick={hide} className="text-xs text-gray-400 hover:text-gray-600">
        Hide
      </button>
      <span className="text-xs text-gray-400">({countdown}s)</span>
    </span>
  )
}
