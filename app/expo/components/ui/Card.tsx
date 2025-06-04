import React from "react";
import { Card as TamaguiCard, styled } from "tamagui";

export const Card = styled(TamaguiCard, {
  backgroundColor: "$background",
  borderRadius: "$4",
  padding: "$4",
  shadowColor: "$shadowColor",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3,
  borderWidth: 1,
  borderColor: "$borderColor",

  variants: {
    variant: {
      default: {
        backgroundColor: "$background",
      },
      outlined: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "$borderColor",
      },
      elevated: {
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
      },
    },
    size: {
      sm: { padding: "$2" },
      md: { padding: "$4" },
      lg: { padding: "$6" },
    },
  },

  defaultVariants: {
    variant: "default",
    size: "md",
  },
});
