'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Scan, History, Settings as SettingsIcon } from 'lucide-react'

export function Navigation() {
  const pathname = usePathname()
  if (pathname === '/') return null

  const navItems = [
    { label: 'Scan', icon: Scan, path: '/scan' },
    { label: 'History', icon: History, path: '/history' },
    { label: 'Settings', icon: SettingsIcon, path: '/settings' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border pb-safe transition-transform duration-300">
      <nav className="flex items-center justify-around h-16 max-w-lg mx-auto overflow-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link
              key={item.path}
              href={item.path}
              prefetch={true}
              className={`relative flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <item.icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(102,169,255,0.4)]' : ''}`} />
              <span className={`text-[10px] font-medium leading-none transition-opacity ${isActive ? 'opacity-100' : 'opacity-80'}`}>{item.label}</span>
              {isActive && (
                <div
                  className="absolute bottom-0 w-8 h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(102,169,255,0.5)]"
                  aria-hidden="true"
                />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
