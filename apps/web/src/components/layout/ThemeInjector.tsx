import { hexToHsl, type StorefrontTheme } from '@hh/domain';

export function ThemeInjector({ theme }: { theme: StorefrontTheme }) {
  const cssVariables = `
    :root {
      /* Dynamic shadcn/ui semantic tokens */
      --background: ${hexToHsl(theme.background)};
      --foreground: ${hexToHsl(theme.textPrimary)};
      --card: ${hexToHsl(theme.surface)};
      --card-foreground: ${hexToHsl(theme.textPrimary)};
      --popover: ${hexToHsl(theme.surface)};
      --popover-foreground: ${hexToHsl(theme.textPrimary)};
      --primary: ${hexToHsl(theme.primaryEmerald)};
      --primary-foreground: ${hexToHsl(theme.background)};
      --secondary: ${hexToHsl(theme.accentGoldLight)};
      --secondary-foreground: 35 53% 32%;
      --muted: ${hexToHsl(theme.border)};
      --muted-foreground: ${hexToHsl(theme.textSecondary)};
      --accent: ${hexToHsl(theme.accentGold)};
      --accent-foreground: ${hexToHsl(theme.primaryEmerald)};
      --border: ${hexToHsl(theme.border)};
      --input: ${hexToHsl(theme.border)};
      --ring: ${hexToHsl(theme.accentGold)};

      /* Legacy compatibility variables */
      --color-bg: ${theme.background};
      --color-surface: ${theme.surface};
      --color-border: ${theme.border};
      --color-primary: ${theme.primaryEmerald};
      --color-primary-hover: ${theme.primaryEmeraldHover};
      --color-primary-emerald: ${theme.primaryEmerald};
      --color-primary-emerald-hover: ${theme.primaryEmeraldHover};
      --color-accent: ${theme.accentGold};
      --color-accent-light: ${theme.accentGoldLight};
      --color-accent-gold: ${theme.accentGold};
      --color-accent-gold-light: ${theme.accentGoldLight};
      --color-text: ${theme.textPrimary};
      --color-text-muted: ${theme.textSecondary};
    }
  `;

  return <style dangerouslySetInnerHTML={{ __html: cssVariables }} />;
}
