import type { StorefrontTheme } from '@hh/domain';

export function ThemeInjector({ theme }: { theme: StorefrontTheme }) {
  const cssVariables = `
    :root {
      --color-bg: ${theme.background};
      --color-surface: ${theme.surface};
      --color-border: ${theme.border};
      --color-primary: ${theme.primaryEmerald};
      --color-primary-hover: ${theme.primaryEmeraldHover};
      --color-accent: ${theme.accentGold};
      --color-accent-light: ${theme.accentGoldLight};
      --color-text: ${theme.textPrimary};
      --color-text-muted: ${theme.textSecondary};
    }
  `;

  return <style dangerouslySetInnerHTML={{ __html: cssVariables }} />;
}
