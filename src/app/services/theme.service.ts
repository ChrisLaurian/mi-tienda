import { Injectable } from '@angular/core';

const STORAGE_KEY = 'theme_pref_v1';
const DARK_CLASS = 'ion-palette-dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  init() {
    const pref = this.read();
    if (pref === 'dark') {
      this.apply(true);
      return;
    }
    if (pref === 'light') {
      this.apply(false);
      return;
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.apply(prefersDark);
  }

  toggle(): 'light' | 'dark' {
    const isDark = document.body.classList.contains(DARK_CLASS);
    const next = !isDark;
    this.apply(next);
    this.write(next ? 'dark' : 'light');
    return next ? 'dark' : 'light';
  }

  isDark(): boolean {
    return document.body.classList.contains(DARK_CLASS) || document.documentElement.classList.contains(DARK_CLASS);
  }

  set(mode: 'light' | 'dark') {
    this.apply(mode === 'dark');
    this.write(mode);
  }

  private apply(dark: boolean) {
    const body = document.body;
    if (dark) {
      document.documentElement.classList.add(DARK_CLASS);
      body.classList.add(DARK_CLASS);
    } else {
      document.documentElement.classList.remove(DARK_CLASS);
      body.classList.remove(DARK_CLASS);
    }
  }

  private read(): 'light' | 'dark' | 'system' {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === 'light' || v === 'dark' || v === 'system') return v;
      return 'system';
    } catch {
      return 'system';
    }
  }

  private write(v: 'light' | 'dark' | 'system') {
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      return;
    }
  }
}
