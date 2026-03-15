const DARK_MODE_COLORS = {
  background: '#0a0e27',
  surface: '#1a1f3a',
  surface_light: '#252d4a',
  text_primary: '#e4e6eb',
  text_secondary: '#b0b3c1',
  primary: '#dc2626',
  primary_light: '#ef4444',
  primary_dark: '#991b1b',
  secondary: '#1f2937',
  border: '#374151',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6'
};

const LIGHT_MODE_COLORS = {
  background: '#ffffff',
  surface: '#f9fafb',
  surface_light: '#f3f4f6',
  text_primary: '#111827',
  text_secondary: '#6b7280',
  primary: '#dc2626',
  primary_light: '#ef4444',
  primary_dark: '#991b1b',
  secondary: '#f3f4f6',
  border: '#e5e7eb',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6'
};

class ThemeService {
  constructor() {
    this.currentTheme = 'light';
  }

  getDarkModeColors() {
    return DARK_MODE_COLORS;
  }

  getLightModeColors() {
    return LIGHT_MODE_COLORS;
  }

  getColors(theme = 'light') {
    return theme === 'dark' ? DARK_MODE_COLORS : LIGHT_MODE_COLORS;
  }

  generateCSSVariables(theme = 'light') {
    const colors = this.getColors(theme);
    let css = ':root {\n';

    for (const [key, value] of Object.entries(colors)) {
      const cssVarName = `--color-${key.replace(/_/g, '-')}`;
      css += `  ${cssVarName}: ${value};\n`;
    }

    css += '}\n';
    return css;
  }

  generateThemeCSS() {
    const darkCSS = `
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: ${DARK_MODE_COLORS.background};
    --bg-secondary: ${DARK_MODE_COLORS.surface};
    --bg-tertiary: ${DARK_MODE_COLORS.surface_light};
    --text-primary: ${DARK_MODE_COLORS.text_primary};
    --text-secondary: ${DARK_MODE_COLORS.text_secondary};
    --border-color: ${DARK_MODE_COLORS.border};
  }
  
  body {
    background-color: var(--bg-primary);
    color: var(--text-primary);
  }
  
  .card, .container {
    background-color: var(--bg-secondary);
    border-color: var(--border-color);
  }
}

@media (prefers-color-scheme: light) {
  :root {
    --bg-primary: ${LIGHT_MODE_COLORS.background};
    --bg-secondary: ${LIGHT_MODE_COLORS.surface};
    --bg-tertiary: ${LIGHT_MODE_COLORS.surface_light};
    --text-primary: ${LIGHT_MODE_COLORS.text_primary};
    --text-secondary: ${LIGHT_MODE_COLORS.text_secondary};
    --border-color: ${LIGHT_MODE_COLORS.border};
  }
  
  body {
    background-color: var(--bg-primary);
    color: var(--text-primary);
  }
  
  .card, .container {
    background-color: var(--bg-secondary);
    border-color: var(--border-color);
  }
}

.dark-mode {
  --bg-primary: ${DARK_MODE_COLORS.background};
  --bg-secondary: ${DARK_MODE_COLORS.surface};
  --bg-tertiary: ${DARK_MODE_COLORS.surface_light};
  --text-primary: ${DARK_MODE_COLORS.text_primary};
  --text-secondary: ${DARK_MODE_COLORS.text_secondary};
  --border-color: ${DARK_MODE_COLORS.border};
  background-color: ${DARK_MODE_COLORS.background};
  color: ${DARK_MODE_COLORS.text_primary};
}

.dark-mode .card,
.dark-mode .container {
  background-color: ${DARK_MODE_COLORS.surface};
  border-color: ${DARK_MODE_COLORS.border};
}

.light-mode {
  --bg-primary: ${LIGHT_MODE_COLORS.background};
  --bg-secondary: ${LIGHT_MODE_COLORS.surface};
  --bg-tertiary: ${LIGHT_MODE_COLORS.surface_light};
  --text-primary: ${LIGHT_MODE_COLORS.text_primary};
  --text-secondary: ${LIGHT_MODE_COLORS.text_secondary};
  --border-color: ${LIGHT_MODE_COLORS.border};
  background-color: ${LIGHT_MODE_COLORS.background};
  color: ${LIGHT_MODE_COLORS.text_primary};
}

.light-mode .card,
.light-mode .container {
  background-color: ${LIGHT_MODE_COLORS.surface};
  border-color: ${LIGHT_MODE_COLORS.border};
}
    `;

    return darkCSS;
  }

  getUserThemePreference(savedTheme) {
    if (savedTheme) return savedTheme;

    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    return 'light';
  }
}

module.exports = new ThemeService();
