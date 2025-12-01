import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all bg-slate-800/80 text-slate-100 border border-slate-700 hover:bg-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700 light:bg-slate-100 light:text-slate-900 light:border-slate-300 light:hover:bg-slate-200"
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? (
        <>
          <Moon className="w-4 h-4" />
          <span className="hidden sm:inline">Dark</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4" />
          <span className="hidden sm:inline">Light</span>
        </>
      )}
    </button>
  );
}
