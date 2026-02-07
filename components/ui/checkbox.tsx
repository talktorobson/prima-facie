'use client'

import * as React from "react"
import { Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  indeterminate?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate = false, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useImperativeHandle(ref, () => inputRef.current!)

    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate
      }
    }, [indeterminate])

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "appearance-none cursor-pointer",
            className
          )}
          ref={inputRef}
          {...props}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-primary-foreground">
          {indeterminate ? (
            <Minus className="h-3 w-3 opacity-0 peer-checked:opacity-100 peer-indeterminate:opacity-100" />
          ) : (
            <Check className="h-3 w-3 opacity-0 peer-checked:opacity-100" />
          )}
        </div>
        <div className="absolute inset-0 rounded-sm bg-primary opacity-0 peer-checked:opacity-100 peer-indeterminate:opacity-100 -z-10" />
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
