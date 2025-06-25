import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    withDelay,
} from 'react-native-reanimated';

interface VoiceWaveformProps {
    isRecording: boolean;
    color?: string;
    cancelColor?: string;
    isCancelZone?: boolean;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
    isRecording,
    color = '#999',
    cancelColor = '#FF4D4D',
    isCancelZone = false,
}) => {
    // 创建8个bar的动画值（相比之前的50个大幅减少）
    const bars = Array.from({ length: 8 }, () => useSharedValue(1));

    useEffect(() => {
        if (isRecording) {
            // 同时启动所有动画，每个有不同的延迟和持续时间
            bars.forEach((bar, index) => {
                bar.value = withDelay(
                    index * 100, // 100ms延迟
                    withRepeat(
                        withTiming(1.5 + Math.random() * 1.5, {
                            duration: 300 + Math.random() * 200,
                            easing: Easing.bezier(0.4, 0, 0.6, 1),
                        }),
                        -1,
                        true
                    )
                );
            });
        } else {
            // 停止所有动画
            bars.forEach((bar) => {
                bar.value = withTiming(1, { duration: 200 });
            });
        }
    }, [isRecording]);

    const animatedStyles = bars.map((bar) =>
        useAnimatedStyle(() => ({
            transform: [{ scaleY: bar.value }],
        }))
    );

    const currentColor = isCancelZone ? cancelColor : color;

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                height: 24,
                justifyContent: 'center',
            }}
        >
            {animatedStyles.map((style, index) => (
                <Animated.View
                    key={index}
                    style={[
                        {
                            width: index % 2 === 0 ? 3 : 2,
                            height: 12,
                            marginHorizontal: 1.5,
                            backgroundColor: currentColor,
                            borderRadius: 2,
                        },
                        style,
                    ]}
                />
            ))}
        </View>
    );
}; 