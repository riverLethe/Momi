import { createTamagui } from "tamagui";
import { createInterFont } from "@tamagui/font-inter";
import { shorthands } from "@tamagui/shorthands";
import { themes, tokens } from "@tamagui/themes";
import { createAnimations } from "@tamagui/animations-react-native";

const animations = createAnimations({
  bouncy: {
    type: "spring",
    damping: 10,
    mass: 1.2,
    stiffness: 100,
  },
  lazy: {
    type: "spring",
    damping: 20,
    stiffness: 60,
  },
  quick: {
    type: "spring",
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
});

const headingFont = createInterFont();
const bodyFont = createInterFont();

// 自定义themes，修改light主题的background颜色
const customThemes = {
  ...themes,
  light: {
    ...themes.light,
    background: "#eeeeee",
    card: "white",
  },
  dark: {
    ...themes.dark,
    background: "#111111",
    card: "#222222",
  },
};

const config = createTamagui({
  themes: customThemes,
  tokens,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  animations,
});

export type AppConfig = typeof config;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
