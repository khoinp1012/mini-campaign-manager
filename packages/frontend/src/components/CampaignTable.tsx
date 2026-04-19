import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Campaign } from '../types';
import { TableSkeleton } from './Skeleton';
import api from '../api/client';
import { useToastStore } from '../store/useToastStore';

interface CampaignTableProps {
  campaigns: Campaign[];
  isLoading: boolean;
  onActionSuccess?: () => void;
}

export default function CampaignTable({ campaigns, isLoading, onActionSuccess }: CampaignTableProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  // Schedule modal state
  const [schedulingId, setSchedulingId] = useState<number | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-surface-container-highest text-on-surface-variant border border-outline-variant/30">Draft</span>;
      case 'scheduled':
        return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">scheduled</span>;
      case 'sending':
        return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">Sending</span>;
      case 'sent':
        return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Sent</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-surface-container-highest text-on-surface-variant border border-outline-variant/30">{status}</span>;
    }
  };

  const getCampaignIcon = (status: string) => {
    switch (status) {
      case 'sent': return 'rocket_launch';
      case 'scheduled': return 'event';
      default: return 'edit_note';
    }
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      addToast('Campaign deleted.', 'success');
      onActionSuccess?.();
    },
    onError: () => {
      addToast('Failed to delete campaign.', 'error');
    },
  });

  // Schedule mutation
  const scheduleMutation = useMutation({
    mutationFn: async ({ id, scheduled_at }: { id: number; scheduled_at: string }) => {
      const res = await api.post(`/campaigns/${id}/schedule`, { scheduled_at });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      addToast('Campaign scheduled.', 'success');
      setSchedulingId(null);
      setScheduleDate('');
      onActionSuccess?.();
    },
    onError: () => {
      addToast('Failed to schedule campaign.', 'error');
      setSchedulingId(null);
    },
  });

  // Send mutation
  const sendMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/campaigns/${id}/send`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      addToast('Dispatch sequence initiated.', 'success');
      onActionSuccess?.();
    },
    onError: () => {
      addToast('Failed to initiate dispatch.', 'error');
    },
  });

  const handleScheduleSubmit = () => {
    if (!schedulingId || !scheduleDate) return;
    scheduleMutation.mutate({ id: schedulingId, scheduled_at: new Date(scheduleDate).toISOString() });
  };

  return (
    <>
      <div className="glass-panel rounded-2xl border border-outline-variant/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container-low/50">
                <th className="px-8 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Campaign Name</th>
                <th className="px-8 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Schedule</th>
                <th className="px-8 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-surface-container-highest/30 transition-colors group" data-testid={`campaign-row-${campaign.id}`}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-surface-container-high flex items-center justify-center">
                        <span className={`material-symbols-outlined text-lg ${campaign.status === 'scheduled' ? 'text-primary' : campaign.status === 'sent' ? 'text-secondary' : 'text-on-surface-variant'}`}>
                          {getCampaignIcon(campaign.status)}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-on-surface tracking-tight truncate">{campaign.name}</span>
                        <span className="text-xs text-on-surface-variant truncate">{campaign.subject}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {getStatusBadge(campaign.status)}
                  </td>
                  <td className="px-8 py-6 text-sm text-on-surface-variant">
                    {campaign.status !== 'draft' || campaign.scheduledAt ? (
                      <>
                        {new Date(campaign.scheduledAt || campaign.updatedAt).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}
                        <span className="mx-1">&middot;</span>
                        {new Date(campaign.scheduledAt || campaign.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </>
                    ) : (
                      <span className="text-on-surface-variant/30 italic">Not Scheduled</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {campaign.status === 'draft' && (
                        <>
                          <button
                            onClick={() => deleteMutation.mutate(campaign.id)}
                            disabled={deleteMutation.isPending}
                            className="px-3 py-1.5 bg-surface-container-low border border-outline-variant/10 text-on-surface-variant hover:text-error hover:border-error/30 transition-all rounded-lg flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            <span>Delete</span>
                          </button>
                          <button
                            onClick={() => { setSchedulingId(campaign.id); setScheduleDate(''); }}
                            className="w-[100px] justify-center px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all rounded-lg flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight"
                          >
                            <span className="material-symbols-outlined text-sm">calendar_month</span>
                            <span>Schedule</span>
                          </button>
                          <button
                            onClick={() => sendMutation.mutate(campaign.id)}
                            disabled={sendMutation.isPending}
                            className="w-[100px] justify-center px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all rounded-lg flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight disabled:opacity-50"
                          >
                            {sendMutation.isPending && sendMutation.variables === campaign.id ? (
                              <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                            ) : (
                              <span className="material-symbols-outlined text-sm">send</span>
                            )}
                            <span>Send</span>
                          </button>
                        </>
                      )}
                      {campaign.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => { setSchedulingId(campaign.id); setScheduleDate(''); }}
                            className="w-[100px] justify-center px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all rounded-lg flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight"
                          >
                            <span className="material-symbols-outlined text-sm">calendar_month</span>
                            <span>Reschedule</span>
                          </button>
                          <button
                            onClick={() => sendMutation.mutate(campaign.id)}
                            disabled={sendMutation.isPending}
                            className="w-[100px] justify-center px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all rounded-lg flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight disabled:opacity-50"
                          >
                            {sendMutation.isPending && sendMutation.variables === campaign.id ? (
                              <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                            ) : (
                              <span className="material-symbols-outlined text-sm">send</span>
                            )}
                            <span>Send Now</span>
                          </button>
                        </>
                      )}
                      <Link
                        to={`/campaigns/${campaign.id}`}
                        className="px-3 py-1.5 hover:bg-surface-container-highest rounded-lg transition-all text-primary flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight border border-primary/10 hover:border-primary/30"
                        title="View Details"
                      >
                        <span className="material-symbols-outlined text-sm">read_more</span>
                        <span>View</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center text-on-surface-variant border border-outline-variant/10">
                        <span className="material-symbols-outlined text-3xl">send</span>
                      </div>
                      <p className="text-on-surface-variant font-medium">No campaigns found.</p>
                    </div>
                  </td>
                </tr>
              )}
              {isLoading && campaigns.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-10">
                    <TableSkeleton />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Modal */}
      {schedulingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-8 rounded-2xl border border-outline-variant/10 shadow-2xl w-full max-w-md space-y-6">
            <h3 className="text-xl font-black text-on-surface tracking-tight">Schedule Campaign</h3>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface-variant">Send at</label>
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-on-surface focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleScheduleSubmit}
                disabled={!scheduleDate || scheduleMutation.isPending}
                data-testid="schedule-submit-btn"
                className="flex-1 py-3 bg-primary text-on-primary font-black rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                {scheduleMutation.isPending
                  ? <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  : <span className="material-symbols-outlined text-sm">schedule_send</span>
                }
                Schedule
              </button>
              <button
                onClick={() => { setSchedulingId(null); setScheduleDate(''); }}
                className="flex-1 py-3 bg-surface-container-high text-on-surface font-bold rounded-xl border border-outline-variant/20 hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
