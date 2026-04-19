import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import type { Campaign } from '../types';
import CampaignTable from '../components/CampaignTable';
import { Link } from 'react-router-dom';

export default function CampaignList() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', page],
    queryFn: async () => {
      const res = await api.get(`/campaigns?page=${page}&limit=${limit}`);
      return res.data;
    },
  });

  const campaigns = data?.campaigns || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-on-surface mb-2">Campaign Console</h1>
          <p className="text-on-surface-variant font-medium">Manage and monitor all outgoing communication vectors</p>
        </div>
        <Link 
          to="/campaigns/new" 
          className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 w-fit"
        >
          <span className="material-symbols-outlined">add</span>
          New Campaign
        </Link>
      </div>

      <CampaignTable campaigns={campaigns} isLoading={isLoading} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="p-2 rounded-lg bg-surface-container-high text-on-surface disabled:opacity-30 transition-all hover:bg-surface-container-highest"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span className="text-sm font-black tracking-widest text-on-surface-variant uppercase">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
            className="p-2 rounded-lg bg-surface-container-high text-on-surface disabled:opacity-30 transition-all hover:bg-surface-container-highest"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
}
