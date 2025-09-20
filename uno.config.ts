import { defineConfig, presetWind3, presetWind4, presetIcons } from 'unocss'
import presetAnimations from "unocss-preset-animations";
import { presetShadcn } from "unocss-preset-shadcn";
import presetCatppuccin from '@catppuccin/unocss';

export default defineConfig({
  presets: [
    presetWind3(),
    presetWind4({
      preflights: {
        reset: true,
      }
    }),
    presetAnimations(),
    presetShadcn(),
    presetCatppuccin(),
    presetIcons({
      collections: {
        lucide: () => import('@iconify-json/lucide/icons.json').then(i => i.default),
      }
    })
  ],
  content: {
    pipeline: {
      include: [
        // the default
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        // include js/ts files
        "(components|src)/**/*.{js,ts}",
      ],
    },
  },
})