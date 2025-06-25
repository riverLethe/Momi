import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

interface SimpleVoiceIndicatorProps {
    isRecording: boolean;
    color?: string;
    cancelColor?: string;
    isCancelZone?: boolean;
}

export const SimpleVoiceIndicator: React.FC<SimpleVoiceIndicatorProps> = ({
    isRecording,
    color = '#999',
    cancelColor = '#FF4D4D',
    isCancelZone = false,
}) => {
    // 只使用3个动画值，大幅减少复杂度
    const dot1 = useRef(new Animated.Value(1)).current;
    const dot2 = useRef(new Animated.Value(1)).current;
    const dot3 = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isRecording) {
            // 创建简单的脉冲动画
            const createPulse = (animValue: Animated.Value, delay: number) =>
                Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(animValue, {
                            toValue: 1.8,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                        Animated.timing(animValue, {
                            toValue: 1,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                    ])
                );

            // 立即启动所有动画
            const animation1 = createPulse(dot1, 0);
            const animation2 = createPulse(dot2, 133);
            const animation3 = createPulse(dot3, 266);

            animation1.start();
            animation2.start();
            animation3.start();

            return () => {
                animation1.stop();
                animation2.stop();
                animation3.stop();
            };
        } else {
            // 快速重置
            dot1.setValue(1);
            dot2.setValue(1);
            dot3.setValue(1);
        }
    }, [isRecording]);

    const currentColor = isCancelZone ? cancelColor : color;

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                height: 24,
            }}
        >
            {[dot1, dot2, dot3].map((dot, index) => (
                <Animated.View
                    key={index}
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: currentColor,
                        marginHorizontal: 3,
                        transform: [{ scale: dot }],
                    }}
                />
            ))}
        </View>
    );
}; 