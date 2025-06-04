import { createTamagui } from "tamagui";
import { createInterFont } from "@tamagui/font-inter";
import { shorthands } from "@tamagui/shorthands";
import { themes, tokens } from "@tamagui/themes";
import { createAnimations } from '@tamagui/animations-react-native'

const animations = createAnimations({
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 1.2,
    stiffness: 100,
  },
  lazy: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
  },
  quick: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
})

const headingFont = createInterFont();
const bodyFont = createInterFont();

const config = createTamagui({
  themes,
  tokens,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  animations
});

export type AppConfig = typeof config;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
