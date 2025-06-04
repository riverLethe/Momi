import React from "react";
import { Button as TamaguiButton, styled } from "tamagui";

export const Button = styled(TamaguiButton, {
  borderRadius: "$4",
  fontWeight: "600",
  cursor: "pointer",

  variants: {
    variant: {
      default: {
        backgroundColor: "$blue10",
        color: "white",
        hoverStyle: {
          backgroundColor: "$blue11",
        },
        pressStyle: {
          backgroundColor: "$blue9",
        },
      },
      outline: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "$blue10",
        color: "$blue10",
        hoverStyle: {
          backgroundColor: "$blue2",
        },
        pressStyle: {
          backgroundColor: "$blue3",
        },
      },
      ghost: {
        backgroundColor: "transparent",
        color: "$blue10",
        hoverStyle: {
          backgroundColor: "$blue2",
        },
        pressStyle: {
          backgroundColor: "$blue3",
        },
      },
      destructive: {
        backgroundColor: "$red10",
        color: "white",
        hoverStyle: {
          backgroundColor: "$red11",
        },
        pressStyle: {
          backgroundColor: "$red9",
        },
      },
    },
    size: {
      sm: {
        height: "$3",
        paddingHorizontal: "$3",
        fontSize: "$2",
      },
      md: {
        height: "$4",
        paddingHorizontal: "$4",
        fontSize: "$3",
      },
      lg: {
        height: "$5",
        paddingHorizontal: "$6",
        fontSize: "$4",
      },
    },
  },

  defaultVariants: {
    variant: "default",
    size: "md",
  },
});
