import React, { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import {
  RectButton,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";
import { Trash2 } from "lucide-react-native";
import { useTheme } from "tamagui";

interface SwipeableRowProps {
  children: ReactNode;
  /** Callback fired when the delete action is pressed */
  onDelete?: () => void;
  /** Disable swipe interaction */
  disabled?: boolean;
  /** Width of the right action button */
  rightActionWidth?: number;
  /** When true the row stays open (action revealed). Controlled via parent */
  isOpen?: boolean;
  /** Notifies parent when the row has been swiped open */
  onSwipeOpen?: () => void;
  /** Notifies parent when the row has been closed (swiped back) */
  onSwipeClose?: () => void;
  /** Notifies parent when the user starts a swipe gesture on this row */
  onSwipeStart?: () => void;
}

/**
 * SwipeableRow provides a lightweight alternative to the deprecated `Swipeable` component
 * from `react-native-gesture-handler`, implemented with the new Reanimated + Gesture API.
 * It currently supports a single "delete" action revealed when swiping left.
 */
export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onDelete,
  disabled = false,
  rightActionWidth = 60,
  isOpen = false,
  onSwipeOpen,
  onSwipeClose,
  onSwipeStart,
}) => {
  const theme = useTheme();
  const translateX = useSharedValue(0);
  const threshold = rightActionWidth;
  const startX = useSharedValue(0);

  // Require the finger to move at least 10 px horizontally before we treat the interaction
  // as a swipe gesture. This prevents a simple tap from accidentally opening the row.
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // start only when translationX < -10 or > 10
    .failOffsetY([-10, 10]) // cancel if the user is primarily scrolling vertically
    .hitSlop({ left: -30 })
    .onTouchesDown(() => {
      if (disabled || !onDelete) return;
      if (onSwipeStart) {
        runOnJS(onSwipeStart)();
      }
    })
    .onStart(() => {
      if (onSwipeStart) {
        runOnJS(onSwipeStart)();
      }
      startX.value = translateX.value; // remember where gesture began
    })
    .onUpdate((event) => {
      if (disabled || !onDelete) return;

      // Desired position = startX + movement
      const nextX = startX.value + event.translationX;
      // Clamp between -threshold and 0 so that we can also swipe right to close
      translateX.value = Math.min(0, Math.max(nextX, -threshold));
    })
    .onEnd(() => {
      if (disabled || !onDelete) {
        translateX.value = withTiming(0);
        return;
      }

      const shouldOpen = translateX.value < -threshold / 2;
      translateX.value = withTiming(shouldOpen ? -threshold : 0, {
        duration: 150,
      });

      // Notify parent about state change
      if (shouldOpen) {
        if (onSwipeOpen) {
          // Call on the JS thread
          runOnJS(onSwipeOpen)();
        }
      } else {
        if (onSwipeClose) {
          runOnJS(onSwipeClose)();
        }
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Width animation for the right action based on swipe progress
  const rightActionAnimatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      -translateX.value,
      [0, threshold],
      [0, rightActionWidth],
      Extrapolation.CLAMP
    );
    return { width };
  });

  // React to external isOpen prop changes
  React.useEffect(() => {
    if (disabled || !onDelete) return;

    if (isOpen) {
      translateX.value = withTiming(-threshold, { duration: 150 });
    } else {
      translateX.value = withTiming(0, { duration: 150 });
    }
  }, [isOpen]);

  return (
    <View style={styles.container}>
      {/* Right delete action */}
      {!!onDelete && (
        <Animated.View style={[
          styles.rightAction,
          rightActionAnimatedStyle,
          { backgroundColor: theme.red9?.get() }
        ]}>
          <RectButton
            enabled={!disabled}
            style={
              (styles.rightActionBtn,
              {
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
              })
            }
            onPress={onDelete}
          >
            <Trash2 size={20} color="#FFFFFF" />
          </RectButton>
        </Animated.View>
      )}

      {/* Foreground content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  rightAction: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  rightActionBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

SwipeableRow.displayName = "SwipeableRow";
