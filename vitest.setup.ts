import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
process.env.NEXT_PUBLIC_WS_URL = 'http://localhost:5000';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:5000';
