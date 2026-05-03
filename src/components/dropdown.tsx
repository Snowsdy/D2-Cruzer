/* eslint-disable react-hooks/set-state-in-effect */
/**
 * Shared custom dropdown — replaces native <select> across the app so every
 * select surface matches the Cruzer dark/magenta aesthetic. The browser's
 * native <option> popup is un-stylable (renders in the OS theme — white on
 * Windows), which clashes with the rest of the UI; this component is a
 * portal-rendered panel that inherits the app's visual language.
 *
 * Keyboard: Space/Enter to open, ArrowUp/Down to move, Enter to pick,
 * Esc to close. Typing a letter jumps to the next option starting with it.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"

export interface DropdownOption<T extends string = string> {
  value: T
  label: ReactNode
  /** Extra right-aligned content (count, badge, shortcut). */
  suffix?: ReactNode
  /** Disables selection — shown dimmed, skipped by keyboard nav. */
  disabled?: boolean
}

export interface DropdownProps<T extends string = string> {
  value: T
  onChange: (value: T) => void
  options: DropdownOption<T>[]
  /** Label shown when nothing matches `value` (shouldn't normally happen). */
  placeholder?: string
  /** Visual variant. `pill` is the rounded-full default; `md` is rounded-md. */
  variant?: "pill" | "md"
  /** Trigger size. `sm` matches h-7, `md` matches h-8 (default). */
  size?: "sm" | "md"
  /** Extra class names for the trigger button. */
  className?: string
  /** aria-label for the button. */
  ariaLabel?: string
  /** Optional icon placed at the start of the trigger. */
  icon?: ReactNode
  disabled?: boolean
}

const SIZES = {
  sm: "h-7 text-[11px] px-2.5",
  md: "h-8 text-[11.5px] px-3",
} as const

const SHAPES = {
  pill: "rounded-full",
  md: "rounded-md",
} as const

export function Dropdown<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  variant = "md",
  size = "md",
  className = "",
  ariaLabel,
  icon,
  disabled,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState<number>(() =>
    Math.max(
      0,
      options.findIndex((o) => o.value === value)
    )
  )
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelRect, setPanelRect] = useState<{
    top: number
    left: number
    width: number
    flip: boolean
  } | null>(null)

  const current = options.find((o) => o.value === value)

  // Reposition the panel next to the trigger every time it opens. Checks
  // whether there's room below; flips above if not.
  const position = useCallback(() => {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    const panelH = Math.min(320, Math.max(44, options.length * 34 + 8))
    const spaceBelow = window.innerHeight - r.bottom
    const flip = spaceBelow < panelH + 16 && r.top > panelH + 16
    setPanelRect({
      top: flip ? r.top - panelH - 6 : r.bottom + 6,
      left: r.left,
      width: Math.max(160, r.width),
      flip,
    })
  }, [options.length])

  useLayoutEffect(() => {
    if (open) position()
  }, [open, position])

  useEffect(() => {
    if (!open) return
    const onScroll = () => position()
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onScroll)
    }
  }, [open, position])

  // Close on outside click + Esc.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t))
        return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  // Sync active index with value whenever it changes externally.
  useEffect(() => {
    const idx = options.findIndex((o) => o.value === value)
    if (idx >= 0) setActiveIdx(idx)
  }, [value, options])

  const move = (dir: 1 | -1) => {
    if (options.length === 0) return
    let i = activeIdx
    for (let n = 0; n < options.length; n++) {
      i = (i + dir + options.length) % options.length
      if (!options[i].disabled) {
        setActiveIdx(i)
        return
      }
    }
  }

  const commit = (idx: number) => {
    const o = options[idx]
    if (!o || o.disabled) return
    onChange(o.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      if (!open) setOpen(true)
      else move(e.key === "ArrowDown" ? 1 : -1)
      return
    }
    if (!open && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault()
      setOpen(true)
      return
    }
    if (open && e.key === "Enter") {
      e.preventDefault()
      commit(activeIdx)
      return
    }
    // Typeahead
    if (open && e.key.length === 1 && /\S/.test(e.key)) {
      const letter = e.key.toLowerCase()
      const start = (activeIdx + 1) % options.length
      for (let k = 0; k < options.length; k++) {
        const i = (start + k) % options.length
        const label =
          typeof options[i].label === "string"
            ? (options[i].label as string)
            : options[i].value
        if (!options[i].disabled && label.toLowerCase().startsWith(letter)) {
          setActiveIdx(i)
          return
        }
      }
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onTriggerKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        className={[
          "bg-bungie-panel/60 inline-flex cursor-pointer appearance-none items-center gap-2 border font-semibold tracking-wider text-white uppercase transition-colors",
          SIZES[size],
          SHAPES[variant],
          open
            ? "border-bungie-accent/60 shadow-[0_0_0_1px_rgba(243,7,94,0.25),0_0_18px_rgba(243,7,94,0.15)]"
            : "border-bungie-border hover:border-bungie-accent/45",
          disabled ? "cursor-not-allowed opacity-50" : "",
          className,
        ].join(" ")}
      >
        {icon && (
          <span className="text-bungie-accent/80 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">
            {icon}
          </span>
        )}
        <span className="truncate leading-none">
          {current?.label ?? placeholder ?? ""}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`ml-auto shrink-0 opacity-70 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open &&
        panelRect &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            style={{
              position: "fixed",
              top: panelRect.top,
              left: panelRect.left,
              width: panelRect.width,
              maxHeight: 320,
              zIndex: 1000,
            }}
            className={[
              "border-bungie-accent/30 overflow-auto rounded-xl border p-1 backdrop-blur-xl",
              "bg-[rgba(13,13,22,0.97)] shadow-[0_18px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(243,7,94,0.08)]",
              panelRect.flip ? "origin-bottom" : "origin-top",
              "animate-[dropdown-in_120ms_ease-out]",
            ].join(" ")}
          >
            {options.map((o, i) => {
              const active = i === activeIdx
              const selected = o.value === value
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    commit(i)
                  }}
                  disabled={o.disabled}
                  className={[
                    "flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[12px] font-semibold transition-colors",
                    o.disabled
                      ? "cursor-not-allowed opacity-40"
                      : active
                        ? "bg-bungie-accent/15 text-white"
                        : "text-white/80 hover:text-white",
                    selected && !o.disabled ? "text-bungie-accent" : "",
                  ].join(" ")}
                >
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.suffix && (
                    <span className="shrink-0 text-[10px] text-white/45">
                      {o.suffix}
                    </span>
                  )}
                  {selected && (
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-bungie-accent shrink-0"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>,
          document.body
        )}
    </>
  )
}
