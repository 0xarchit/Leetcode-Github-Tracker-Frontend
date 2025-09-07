import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)")
      const apply = () => {
        const systemTheme = media.matches ? "dark" : "light"
        root.classList.remove("light", "dark")
        root.classList.add(systemTheme)
      }
      apply()
      // Keep in sync when OS theme changes
      media.addEventListener?.("change", apply)
      return () => media.removeEventListener?.("change", apply)
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (next: Theme) => {
      try {
        localStorage.setItem(storageKey, next)
      } catch {}
      setThemeState(next)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}