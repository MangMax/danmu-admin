import { mergeConfigs, presetWind3, presetWind4, presetIcons } from 'unocss'
import presetAnimations from "unocss-preset-animations";
import { presetShadcn } from "unocss-preset-shadcn";
import config from './.nuxt/uno.config.mjs'

export default mergeConfigs([config, {
  presets: [
    presetWind3(),
    presetWind4({
      preflights: {
        reset: true,
      }
    }),
    presetAnimations(),
    presetShadcn(),
    presetIcons()
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
}])