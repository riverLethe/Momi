import React from "react";
import { Text as TamaguiText, styled } from "tamagui";

export const Text = styled(TamaguiText, {
  fontFamily: "$body",
  color: "$color",

  variants: {
    size: {
      xs: { fontSize: "$1" },
      sm: { fontSize: "$2" },
      md: { fontSize: "$3" },
      lg: { fontSize: "$4" },
      xl: { fontSize: "$5" },
    },
    weight: {
      normal: { fontWeight: "400" },
      medium: { fontWeight: "500" },
      semibold: { fontWeight: "600" },
      bold: { fontWeight: "700" },
    },
    color: {
      primary: { color: "$primary" },
      secondary: { color: "$gray10" },
      muted: { color: "$gray8" },
      success: { color: "$green10" },
      error: { color: "$red10" },
      warning: { color: "$yellow10" },
    },
  },

  defaultVariants: {
    size: "md",
    weight: "normal",
  },
});
