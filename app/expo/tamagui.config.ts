import { defaultConfig } from "@tamagui/config/v4";
import { createTamagui } from "tamagui";
import { themes, tokens } from "@tamagui/themes";

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  themes,
  tokens,
});

export default tamaguiConfig;

export type Conf = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}
