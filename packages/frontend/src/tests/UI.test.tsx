import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CampaignTable from '../components/CampaignTable';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('UI Engineering Verification', () => {
  describe('F2.1: Status Badges', () => {
    it('Requirement: Status colors match spec (Draft, Scheduled, Sent)', () => {
      const mockCampaigns: any[] = [
        { id: 1, name: 'C1', status: 'draft', createdAt: new Date() },
        { id: 2, name: 'C2', status: 'scheduled', createdAt: new Date() },
        { id: 3, name: 'C3', status: 'sent', createdAt: new Date() },
      ];

      render(
        <QueryClientProvider client={makeClient()}>
          <MemoryRouter>
            <CampaignTable campaigns={mockCampaigns} isLoading={false} />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Verify draft badge
      const draftBadge = screen.getByText(/Draft/i);
      expect(draftBadge.className).toContain('bg-surface-container-highest');

      // Verify scheduled badge
      const scheduledBadge = screen.getByText(/Scheduled/i);
      expect(scheduledBadge.className).toContain('text-blue-400');

      // Verify sent badge
      const sentBadge = screen.getByText(/Sent/i);
      expect(sentBadge.className).toContain('text-emerald-400');
    });
  });

  describe('F2.5: Loading States', () => {
    it('Requirement: Loading feedback is visible during fetch', () => {
      const { container } = render(
        <QueryClientProvider client={makeClient()}>
          <MemoryRouter>
            <CampaignTable campaigns={[]} isLoading={true} />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Verify that at least one skeleton element with animate-pulse exists
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });
});
