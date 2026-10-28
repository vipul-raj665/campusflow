import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { NotificationProvider } from '../context/NotificationContext';
import App from '../App';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';

// Mock network API and Socket.IO for component isolation in test environment
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { data: { resources: [] } } }),
    post: vi.fn().mockRejectedValue({ response: { status: 401 } }),
    patch: vi.fn().mockResolvedValue({ data: { success: true } }),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  setAccessToken: vi.fn(),
  getAccessToken: vi.fn(() => null),
  clearAccessToken: vi.fn(),
}));

vi.mock('../services/socket', () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
  })),
}));

describe('Frontend Component Tests', () => {
  it('renders Badge component with correct variant', () => {
    render(<Badge variant="approved">Confirmed</Badge>);
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('renders Modal dialog when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal Dialog">
        <p>Modal Body Content</p>
      </Modal>
    );
    expect(screen.getByText('Test Modal Dialog')).toBeInTheDocument();
    expect(screen.getByText('Modal Body Content')).toBeInTheDocument();
  });

  it('renders landing page with headline and quick demo access buttons', async () => {
    render(
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    );

    // Headline check
    expect(
      screen.getByRole('heading', { level: 1, name: /Smart Campus Resource Booking/i })
    ).toBeInTheDocument();

    // Check demo buttons
    expect(screen.getByText('Launch Admin Console')).toBeInTheDocument();
    expect(screen.getByText('Launch Faculty Hub')).toBeInTheDocument();
    expect(screen.getByText('Launch Student Portal')).toBeInTheDocument();
  });
});
