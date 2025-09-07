import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-dashboard-nav-foreground hover:bg-dashboard-nav-foreground/10">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as any)}>
          <DropdownMenuRadioItem value="light" onSelect={(e) => { e.preventDefault(); setTheme("light") }}>
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" onSelect={(e) => { e.preventDefault(); setTheme("dark") }}>
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" onSelect={(e) => { e.preventDefault(); setTheme("system") }}>
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}