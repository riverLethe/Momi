'use client';

import React from 'react';
import { NextUIProvider } from '@nextui-org/react';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <NextUIProvider>
      {children}
    </NextUIProvider>
  );
}