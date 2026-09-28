import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly isDarkMode = signal<boolean>(false);

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('finanzen-theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = savedTheme ? savedTheme === 'dark' : prefersDark;
      this.setTheme(shouldBeDark);
    }
  }

  toggleTheme(): void {
    this.setTheme(!this.isDarkMode());
  }

  setTheme(dark: boolean): void {
    this.isDarkMode.set(dark);
    if (typeof document !== 'undefined') {
      if (dark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('finanzen-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('finanzen-theme', 'light');
      }
    }
  }
}
