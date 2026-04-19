import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Silence JSDOM CSS parsing errors (harmless noise from Tailwind v4)
// We silence both console.error and console.warn to be extra thorough
const silenceNoise = (...args: any[]) => {
  const message = typeof args[0] === 'string' ? args[0] : '';
  if (message.includes('Could not parse CSS stylesheet')) return;
  if (message.includes('Error: Could not parse CSS stylesheet')) return;
};

const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args: any[]) => {
  silenceNoise(...args);
  if (typeof args[0] === 'string' && args[0].includes('Could not parse CSS stylesheet')) return;
  originalError(...args);
};

console.warn = (...args: any[]) => {
  silenceNoise(...args);
  if (typeof args[0] === 'string' && args[0].includes('Could not parse CSS stylesheet')) return;
  originalWarn(...args);
};

// Mock ResizeObserver for Recharts
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock ResponsiveContainer to just render children (Avoiding JSX in .ts file)
vi.mock('recharts', async (importOriginal) => {
  const original = await importOriginal<typeof import('recharts')>();
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => React.createElement('div', { style: { width: '800px', height: '600px' } }, children),
  };
});
