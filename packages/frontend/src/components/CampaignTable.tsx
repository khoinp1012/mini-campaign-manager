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

export default function CampaignTable({ campaigns = [], isLoading, onActionSuccess }: CampaignTableProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  // Schedule modal state
  const [schedulingId, setSchedulingId] = useState<number | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');

  const getDayDate = (targetDay: number, skipWeeks = 0) => {
    const d = new Date();
    const todayIndex = d.getDay() === 0 ? 7 : d.getDay();
    const targetIndex = targetDay === 0 ? 7 : targetDay;
    const diff = (targetIndex - todayIndex) + (skipWeeks * 7);
    d.setDate(d.getDate() + diff);
    d.setHours(9, 0, 0, 0);
    return d.toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16);
  };

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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['campaigns'] });
      const previousData = queryClient.getQueriesData({ queryKey: ['campaigns'] });

      queryClient.setQueriesData({ queryKey: ['campaigns'] }, (old: any) => {
        if (!old) return old;
        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              campaigns: page.campaigns.filter((c: any) => c.id !== id)
            }))
          };
        }
        if (old.campaigns) {
          return {
            ...old,
            campaigns: old.campaigns.filter((c: any) => c.id !== id)
          };
        }
        return old;
      });

      return { previousData };
    },
    onSuccess: () => {
      addToast('Campaign deleted.', 'success');
      onActionSuccess?.();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (err, id, context: any) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

    },
  });

  // Schedule mutation
  const scheduleMutation = useMutation({
    mutationFn: async ({ id, scheduled_at }: { id: number; scheduled_at: string }) => {
      const res = await api.post(`/campaigns/${id}/schedule`, { scheduled_at });
      return res.data;
    },
    onMutate: async ({ id, scheduled_at }) => {
      await queryClient.cancelQueries({ queryKey: ['campaigns'] });
      const previousData = queryClient.getQueriesData({ queryKey: ['campaigns'] });

      const updateFn = (old: any) => {
        if (!old) return old;
        const updateCampaign = (c: any) => c.id === id ? { ...c, status: 'scheduled', scheduledAt: scheduled_at } : c;
        if (old.pages) {
          return { ...old, pages: old.pages.map((page: any) => ({ ...page, campaigns: page.campaigns.map(updateCampaign) })) };
        }
        if (old.campaigns) {
          return { ...old, campaigns: old.campaigns.map(updateCampaign) };
        }
        return old;
      };

      queryClient.setQueriesData({ queryKey: ['campaigns'] }, updateFn);
      queryClient.setQueryData(['campaign', String(id)], (old: any) => old ? { ...old, status: 'scheduled', scheduledAt: scheduled_at } : old);

      return { previousData };
    },
    onSuccess: () => {
      addToast('Campaign scheduled.', 'success');
      setSchedulingId(null);
      setScheduleDate('');
      onActionSuccess?.();
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      if (data?.id) queryClient.invalidateQueries({ queryKey: ['campaign', String(data.id)] });
    },
    onError: (err, variables, context: any) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

    },
  });

  // Send mutation
  const sendMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/campaigns/${id}/send`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['campaigns'] });
      const previousData = queryClient.getQueriesData({ queryKey: ['campaigns'] });

      const updateFn = (old: any) => {
        if (!old) return old;
        const updateCampaign = (c: any) => c.id === id ? { ...c, status: 'sending' } : c;
        if (old.pages) {
          return { ...old, pages: old.pages.map((page: any) => ({ ...page, campaigns: page.campaigns.map(updateCampaign) })) };
        }
        if (old.campaigns) {
          return { ...old, campaigns: old.campaigns.map(updateCampaign) };
        }
        return old;
      };

      queryClient.setQueriesData({ queryKey: ['campaigns'] }, updateFn);
      queryClient.setQueryData(['campaign', String(id)], (old: any) => old ? { ...old, status: 'sending' } : old);

      return { previousData };
    },
    onSuccess: () => {
      addToast('Dispatch sequence initiated.', 'success');
      onActionSuccess?.();
    },
    onSettled: (_, __, id) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', String(id)] });
    },
    onError: (err, id, context: any) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

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
                            aria-label="Schedule"
                            className="w-[100px] justify-center px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all rounded-lg flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight"
                          >
                            <span className="material-symbols-outlined text-sm">calendar_month</span>
                            <span>Schedule</span>
                          </button>
                          <button
                            onClick={() => sendMutation.mutate(campaign.id)}
                            disabled={sendMutation.isPending}
                            aria-label="Send"
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
                            aria-label="Reschedule"
                            className="w-[100px] justify-center px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all rounded-lg flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight"
                          >
                            <span className="material-symbols-outlined text-sm">calendar_month</span>
                            <span>Reschedule</span>
                          </button>
                          <button
                            onClick={() => sendMutation.mutate(campaign.id)}
                            disabled={sendMutation.isPending}
                            aria-label="Send Now"
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
          <div className="bg-surface p-8 rounded-3xl border border-outline-variant shadow-2xl w-full max-w-md space-y-7 ring-1 ring-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-on-surface tracking-tight">Schedule Campaign</h3>
              <span className="material-symbols-outlined text-primary/50 text-[24px]">event_repeat</span>
            </div>
            <div className="space-y-6">


              <div className="space-y-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  This Week
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Mon', day: 1 }, { label: 'Tue', day: 2 }, { label: 'Wed', day: 3 },
                    { label: 'Thu', day: 4 }, { label: 'Fri', day: 5 }, { label: 'Sat', day: 6 }, { label: 'Sun', day: 0 }
                  ].filter(d => {
                    const today = new Date().getDay() === 0 ? 7 : new Date().getDay();
                    const target = d.day === 0 ? 7 : d.day;
                    return target > today;
                  }).map(d => (
                    <button
                      key={d.label}
                      onClick={() => setScheduleDate(getDayDate(d.day, 0))}
                      className="px-3 py-1.5 rounded-lg border border-primary/10 bg-surface hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all text-[11px] font-black uppercase tracking-tight shadow-sm"
                    >
                      {d.label}
                    </button>
                  ))}
                  {new Date().getDay() === 0 && <span className="text-[10px] text-primary/40 font-bold uppercase tracking-widest px-2 py-1">Next week starts Mon</span>}
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-2xl bg-secondary/5 border border-secondary/10">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">calendar_view_week</span>
                  Next Week
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Mon', day: 1 }, { label: 'Tue', day: 2 }, { label: 'Wed', day: 3 },
                    { label: 'Thu', day: 4 }, { label: 'Fri', day: 5 }, { label: 'Sat', day: 6 }, { label: 'Sun', day: 0 }
                  ].map(d => (
                    <button
                      key={d.label}
                      onClick={() => setScheduleDate(getDayDate(d.day, 1))}
                      className="px-3 py-1.5 rounded-lg border border-secondary/10 bg-surface hover:bg-secondary/10 hover:border-secondary/40 hover:text-secondary transition-all text-[10px] font-black uppercase tracking-tight shadow-sm"
                    >
                      Next {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-2xl bg-surface-container-high border border-outline-variant/10">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  Preferred Time
                </label>
                <div className="flex gap-2">
                  {[
                    { label: '09:00 AM', time: '09:00' },
                    { label: '02:00 PM', time: '14:00' },
                    { label: '08:00 PM', time: '20:00' }
                  ].map(t => (
                    <button
                      key={t.label}
                      onClick={() => {
                        const base = scheduleDate.split('T')[0] || new Date().toLocaleString('sv-SE').slice(0, 10);
                        setScheduleDate(`${base}T${t.time}`);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-outline-variant/20 bg-surface hover:bg-surface-container-highest transition-all text-[11px] font-bold text-on-surface shadow-sm"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface-variant">Manual Adjustment</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant/50 text-[20px]">calendar_today</span>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-on-surface font-bold focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    min={new Date().toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16)}
                    data-testid="schedule-date-input"
                  />
                </div>
              </div>
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
