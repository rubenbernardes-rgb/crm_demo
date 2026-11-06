import { useEffect, useState } from "react";

/**
 * Tracks whether the app is currently in dark mode by observing the
 * `dark` class on <html> (toggled by the theme switcher in Layout).
 */
export function useIsDark(): boolean {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return dark;
}
