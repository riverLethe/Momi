import React from 'react';
import { Card, Text, Separator } from 'tamagui';

interface ProfileSectionProps {
  /* Section title */
  title: string;
  /* Children should be the buttons/rows inside the section */
  children: React.ReactNode;
}

/**
 * Renders a card-like section inside the profile page.
 * It displays a title and the provided children, and applies consistent padding & separators.
 */
export const ProfileSection: React.FC<ProfileSectionProps> = ({ title, children }) => {
  return (
    <Card marginBottom="$5" elevate borderWidth={1} borderColor="$gray6">
      <Text
        paddingHorizontal="$4"
        paddingTop="$4"
        paddingBottom="$3"
        fontWeight="$7"
        color="$gray11"
        fontSize="$3"
      >
        {title.toUpperCase()}
      </Text>
      <Separator />
      {children}
    </Card>
  );
}; 