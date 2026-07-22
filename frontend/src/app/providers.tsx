import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductionProvider } from '../features/production/context/ProductionContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Wraps application elements inside Tanstack Query Client and real-time Production context provider
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ProductionProvider>
        {children}
      </ProductionProvider>
    </QueryClientProvider>
  );
}

