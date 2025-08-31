import { create } from 'zustand'

const THEME_KEY = 'theme-preference'

export const useTheme = create((set, get) => ({
  theme: (typeof window!=='undefined' && localStorage.getItem(THEME_KEY)) || 'dark', // 'light' | 'dark' | 'system'
  setTheme(next){
    try{ localStorage.setItem(THEME_KEY, next) }catch{}
    set({ theme: next })
    applyTheme(next)
  },
}))

export function applyTheme(mode){
  const root = document.documentElement
  const effective = mode === 'system' ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : mode
  root.setAttribute('data-theme', effective)
}

