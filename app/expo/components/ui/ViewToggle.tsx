import React from "react";
import { XStack, Button, Text } from "tamagui";
import { ViewType } from "@/types";

interface ViewToggleProps {
  currentView: ViewType;
  familySpaceName?: string;
  onViewChange: (view: ViewType) => void;
  className?: string;
}

export const ViewToggle: React.FC<ViewToggleProps> = React.memo(
  ({ currentView, familySpaceName, onViewChange, className }) => {
    return (
      <XStack
        backgroundColor="$gray2"
        borderRadius="$4"
        padding="$1"
        className={className}
      >
        <Button
          backgroundColor={
            currentView === "personal" ? "$blue10" : "transparent"
          }
          color={currentView === "personal" ? "white" : "$blue10"}
          size="$3"
          onPress={() => onViewChange("personal")}
          flex={1}
          borderRadius="$3"
        >
          <Text
            fontSize="$2"
            fontWeight="500"
            color={currentView === "personal" ? "white" : "$blue10"}
          >
            个人
          </Text>
        </Button>

        <Button
          backgroundColor={currentView === "family" ? "$blue10" : "transparent"}
          color={currentView === "family" ? "white" : "$blue10"}
          size="$3"
          onPress={() => onViewChange("family")}
          flex={1}
          borderRadius="$3"
        >
          <Text
            fontSize="$2"
            fontWeight="500"
            color={currentView === "family" ? "white" : "$blue10"}
            numberOfLines={1}
          >
            {familySpaceName || "家庭"}
          </Text>
        </Button>
      </XStack>
    );
  }
);

ViewToggle.displayName = "ViewToggle";
