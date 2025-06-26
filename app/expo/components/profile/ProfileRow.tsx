import React from 'react';
import { Button, XStack, Text } from 'tamagui';
import { ChevronRight } from 'lucide-react-native';

interface ProfileRowProps {
    /** Left icon element (usually a coloured Circle with an icon inside) */
    icon: React.ReactNode;
    /** Row label text */
    label: string;
    /** Callback when the row is pressed */
    onPress?: () => void;
    /** Disable press interaction */
    disabled?: boolean;
}

/**
 * A reusable row item for the profile page.
 * It encapsulates common paddings, hover/press styles & chevron indicator.
 */
export const ProfileRow: React.FC<ProfileRowProps> = ({
    icon,
    label,
    onPress,
    disabled,
}) => {
    return (
        <Button
            chromeless
            justifyContent="flex-start"
            hoverStyle={{ backgroundColor: '$gray2' }}
            pressStyle={{ backgroundColor: '$gray3' }}
            onPress={onPress}
            height="$5"
            borderWidth={0}
            disabled={disabled}
            opacity={disabled ? 0.6 : 1}
        >
            <XStack alignItems="center" justifyContent="space-between" width="100%">
                <XStack alignItems="center" gap="$3">
                    {icon}
                    <Text fontWeight="$6" fontSize="$3">
                        {label}
                    </Text>
                </XStack>
                <ChevronRight size={20} color="#9CA3AF" />
            </XStack>
        </Button>
    );
};

ProfileRow.displayName = 'ProfileRow'; 