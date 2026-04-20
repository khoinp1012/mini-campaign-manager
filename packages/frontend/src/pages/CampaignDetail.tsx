import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import type { Campaign } from '../types';
import { Link } from 'react-router-dom';
import { useToastStore } from '../store/useToastStore';

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
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

  // Fetch campaign details
  const { data: campaign, isLoading, isError, refetch } = useQuery<Campaign>({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const res = await api.get(`/campaigns/${id}`);
      return res.data;
    },
    // Poll if sending to see progress
    refetchInterval: (query) => {
      return query.state.data?.status === 'sending' ? 1000 : false;
    }
  });

  // Action Mutations
  const sendMutation = useMutation({
    mutationFn: async () => await api.post(`/campaigns/${id}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      addToast('Dispatch sequence initiated.', 'success');
    }
  });

  const scheduleMutation = useMutation({
    mutationFn: async (scheduled_at: string) => await api.post(`/campaigns/${id}/schedule`, { scheduled_at }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      addToast('Mission pre-scheduled successfully.', 'success');
      setShowScheduler(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => await api.delete(`/campaigns/${id}`),
    onSuccess: () => {
      addToast('Campaign record purged.', 'info');
      navigate('/');
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-4">sync</span>
        <p className="text-on-surface-variant font-medium tracking-tight">Decentralizing campaign data...</p>
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-6xl text-error mb-4">error</span>
        <h2 className="text-2xl font-black text-on-surface">Campaign Not Found</h2>
        <p className="text-on-surface-variant mt-2 font-medium">The campaign matrix block you are looking for does not exist or you don't have access.</p>
        <Link to="/" className="mt-8 inline-flex items-center gap-2 text-primary font-bold hover:text-secondary transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Return Main Console</span>
        </Link>
      </div>
    );
  }

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': 
        return <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-surface-container-highest text-on-surface-variant border border-outline-variant/30">Draft</span>;
      case 'scheduled': 
        return <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">Scheduled</span>;
      case 'sending': 
        return <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)]">Sending</span>;
      case 'sent': 
        return <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">Sent</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group">
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="font-semibold tracking-tight text-sm">Dashboard Console</span>
        </Link>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleManualRefresh}
            className={`p-2 bg-surface-container-low rounded-xl border border-outline-variant/10 text-on-surface hover:text-primary hover:border-primary/30 transition-all ${isRefreshing ? 'rotate-180' : ''}`}
            title="Refresh Data"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
          
          {campaign.status === 'draft' && (
            <>
              <button 
                onClick={() => deleteMutation.mutate()}
                className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/10 text-on-surface hover:text-error hover:border-error/30 hover:bg-error/10 transition-all font-bold text-sm"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
                <span>Delete</span>
              </button>
              
              <button 
                onClick={() => setShowScheduler(!showScheduler)}
                className={`w-[140px] justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold tracking-tight transition-all border text-sm ${showScheduler ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container-low border-outline-variant/10 text-on-surface hover:border-primary/30'}`}
              >
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                <span>{showScheduler ? 'Cancel' : 'Schedule'}</span>
              </button>
              
              <button 
                onClick={() => sendMutation.mutate()}
                disabled={sendMutation.isPending}
                className="w-[140px] justify-center px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container hover:from-primary-container hover:to-primary text-on-primary font-bold tracking-tight rounded-xl transition-all shadow-[0_10px_30px_rgba(62,73,187,0.3)] hover:shadow-[0_10px_40px_rgba(62,73,187,0.5)] hover:-translate-y-0.5 flex items-center gap-2 text-sm"
              >
                {sendMutation.isPending ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined text-[20px]">send</span>}
                <span>Send</span>
              </button>
            </>
          )}

          {campaign.status === 'scheduled' && (
            <>
              <button 
                 onClick={() => setShowScheduler(!showScheduler)}
                 className={`w-[140px] justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold tracking-tight transition-all border text-sm ${showScheduler ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container-low border-outline-variant/10 text-on-surface hover:border-primary/30'}`}
              >
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                <span>{showScheduler ? 'Cancel' : 'Reschedule'}</span>
              </button>
              <button 
                onClick={() => sendMutation.mutate()}
                disabled={sendMutation.isPending}
                className="w-[140px] justify-center px-6 py-2.5 bg-primary text-on-primary font-bold tracking-tight rounded-xl transition-all hover:bg-primary/90 flex items-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
                <span>Send Now</span>
              </button>
            </>
          )}

          {campaign.status === 'sent' && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/10 text-on-surface-variant font-bold text-sm">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>Dispatched</span>
            </div>
          )}
        </div>
      </div>

      {showScheduler && (
        <div className="glass-panel p-6 rounded-2xl border border-primary/30 bg-primary/5 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <div>
                <h4 className="font-black text-on-surface">Mission Pre-Scheduling</h4>
                <p className="text-xs text-on-surface-variant font-medium">Set a future timestamp for automated dispatch</p>
              </div>
            </div>
            
              <div className="flex flex-col gap-4 w-full sm:w-auto">

                <div className="flex flex-wrap gap-1.5 opacity-80">
                  <div className="w-full text-[9px] font-black text-on-surface-variant/40 uppercase tracking-tighter mb-1">This Week</div>
                  {[
                    { label: 'mon', day: 1 }, { label: 'tue', day: 2 }, { label: 'wed', day: 3 },
                    { label: 'thu', day: 4 }, { label: 'fri', day: 5 }, { label: 'sat', day: 6 }, { label: 'sun', day: 0 }
                  ].filter(d => {
                    const today = new Date().getDay() === 0 ? 7 : new Date().getDay();
                    const target = d.day === 0 ? 7 : d.day;
                    return target > today;
                  }).map(d => (
                    <button
                      key={d.label}
                      onClick={() => setScheduleDate(getDayDate(d.day, 0))}
                      className="px-2.5 py-1 rounded-md border border-primary/10 bg-surface hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all text-[11px] font-black uppercase tracking-tight"
                    >
                      {d.label}
                    </button>
                  ))}
                  {new Date().getDay() === 0 && <span className="text-[9px] text-primary/40 font-bold uppercase italic">Next week starts Mon</span>}
                </div>
                
                <div className="space-y-4 pt-2">
                  <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/10 space-y-3 shadow-sm">
                    <div className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      This Week
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'mon', day: 1 }, { label: 'tue', day: 2 }, { label: 'wed', day: 3 },
                        { label: 'thu', day: 4 }, { label: 'fri', day: 5 }, { label: 'sat', day: 6 }, { label: 'sun', day: 0 }
                      ].filter(d => {
                        const today = new Date().getDay() === 0 ? 7 : new Date().getDay();
                        const target = d.day === 0 ? 7 : d.day;
                        return target > today;
                      }).map(d => (
                        <button
                          key={d.label}
                          onClick={() => setScheduleDate(getDayDate(d.day, 0))}
                          className="px-2.5 py-1 rounded-md border border-primary/10 bg-surface hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all text-[11px] font-black uppercase tracking-tight"
                        >
                          {d.label}
                        </button>
                      ))}
                      {new Date().getDay() === 0 && <span className="text-[9px] text-primary/40 font-bold uppercase italic">Next week starts Mon</span>}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-secondary/5 border border-secondary/10 space-y-3 shadow-sm">
                    <div className="text-[10px] font-black text-secondary uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">calendar_view_week</span>
                      Next Week
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { label: 'mon', day: 1 }, { label: 'tue', day: 2 }, { label: 'wed', day: 3 },
                        { label: 'thu', day: 4 }, { label: 'fri', day: 5 }, { label: 'sat', day: 6 }, { label: 'sun', day: 0 }
                      ].map(d => (
                        <button
                          key={d.label}
                          onClick={() => setScheduleDate(getDayDate(d.day, 1))}
                          className="px-2 py-0.5 rounded border border-secondary/10 bg-surface hover:bg-secondary/10 hover:border-secondary/40 hover:text-secondary transition-all text-[9px] font-black uppercase tracking-widest"
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input 
                    type="datetime-local" 
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="flex-1 sm:w-64 bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 text-on-surface font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                    min={new Date().toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16)}
                  />
                  <button 
                    onClick={() => scheduleMutation.mutate(scheduleDate)}
                    disabled={!scheduleDate || scheduleMutation.isPending}
                    className="px-6 py-2.5 bg-primary text-on-primary font-black rounded-xl hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {scheduleMutation.isPending ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined">event_available</span>}
                    <span>Confirm</span>
                  </button>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* Main Campaign Info & Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Detail Panel */}
        <div className="xl:col-span-2 space-y-8">
          <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-outline-variant/10 relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/20 transition-all duration-1000"></div>

            <div className="absolute top-0 right-0 p-8 sm:p-10 z-10">
              {getStatusBadge(campaign.status)}
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-8 relative z-10">
              <div className="w-16 h-16 bg-surface-container-high rounded-2xl flex items-center justify-center text-primary shadow-inner flex-shrink-0 border border-outline-variant/10">
                <span className="material-symbols-outlined text-[32px]">mail</span>
              </div>
              <div className="pt-2">
                <h1 className="text-4xl font-black text-on-surface tracking-tighter mb-2 leading-none pr-32">{campaign.name}</h1>
                <p className="text-on-surface-variant font-medium text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">subject</span>
                  {campaign.subject}
                </p>
              </div>
            </div>

            <div className="relative z-10">
              <div className="absolute -left-4 top-4 bottom-4 w-1 bg-gradient-to-b from-primary/30 to-secondary/30 rounded-full"></div>
              <div className="bg-surface-container-lowest/50 p-6 sm:p-8 rounded-2xl border border-outline-variant/5 text-on-surface min-h-[200px] whitespace-pre-wrap font-medium leading-relaxed shadow-inner">
                {campaign.body}
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-on-surface-variant font-bold tracking-tight relative z-10">
              <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-lg">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                <span>Initiated: {new Date(campaign.createdAt).toLocaleDateString()}</span>
              </div>
              {campaign.scheduledAt && (
                <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg border border-primary/20">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                  <span>Scheduled: {new Date(campaign.scheduledAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Analytics Widget */}
          <div className="bg-gradient-to-br from-surface-container-high to-surface-container overflow-hidden rounded-3xl border border-outline-variant/20 shadow-[0_30px_60px_rgba(6,14,32,0.6)] relative z-0">
            {/* Holographic effect */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay"></div>
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-80 h-80 bg-secondary/20 rounded-full opacity-50 blur-[80px]"></div>
            
            <div className="p-8 sm:p-10 relative z-10">
              <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-on-surface tracking-tight">
                <span className="material-symbols-outlined text-secondary">monitoring</span>
                Telemetry Data
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                <StatBlock label="Target Pool" value={campaign.stats?.total || 0} icon="groups" />
                <StatBlock label="Transmitted" value={campaign.stats?.sent || 0} icon="send" />
                <StatBlock label="Packet Loss" value={campaign.stats?.failed || 0} icon="error" colorClass="text-error" />
                <StatBlock label="Engaged" value={campaign.stats?.opened || 0} icon="visibility" colorClass="text-secondary" />
              </div>

              <div className="space-y-8 bg-surface-container-highest/20 p-6 rounded-2xl border border-white/5">
                <ProgressBar 
                  label="Transmission Success Rate" 
                  percent={campaign.stats?.send_rate || 0} 
                  color="bg-primary"
                />
                <ProgressBar 
                  label="Signal Engagement Rate" 
                  percent={campaign.stats?.open_rate || 0} 
                  color="bg-secondary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recipient List Panel */}
        <div className="xl:col-span-1">
          <div className="glass-panel overflow-hidden rounded-3xl border border-outline-variant/10 shadow-[0_24px_48px_rgba(6,14,32,0.4)] h-full flex flex-col max-h-[850px]">
            <div className="p-6 border-b border-outline-variant/10 bg-surface-container-high/50 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
              <h3 className="font-black text-on-surface tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">contacts</span>
                Recipient Roster
              </h3>
              <span className="text-xs bg-surface-container-low text-on-surface-variant font-black tracking-widest px-3 py-1 rounded-full border border-outline-variant/20">
                {campaign.recipients?.length || 0} ACTIVE
              </span>
            </div>

            <div className="divide-y divide-outline-variant/5 overflow-y-auto custom-scrollbar flex-1 relative">
              {campaign.recipients?.map((recipient: any) => (
                <div key={recipient.id} className="p-5 hover:bg-surface-container-highest/30 transition-colors group relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/0 group-hover:bg-primary/50 transition-colors"></div>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 pr-4">
                      <p className="font-bold text-on-surface truncate text-sm tracking-tight">{recipient.name}</p>
                      <p className="text-[11px] text-on-surface-variant truncate font-medium uppercase tracking-widest mt-0.5">{recipient.email}</p>
                    </div>
                    <RecipientStatusBadge status={recipient.status} />
                  </div>
                  {recipient.openedAt && (
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-secondary font-black uppercase tracking-widest bg-secondary/10 w-fit px-2 py-0.5 rounded border border-secondary/20">
                      <span className="material-symbols-outlined text-[10px]">drafts</span>
                      <span>Signal Ack: {new Date(recipient.openedAt).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              ))}
              {(!campaign.recipients || campaign.recipients.length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant font-medium tracking-tight">
                  No targets acquired.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, icon, colorClass = "text-on-surface" }: { label: string, value: number | string, icon: string, colorClass?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-on-surface-variant text-[10px] font-black uppercase tracking-widest">
        <span className="material-symbols-outlined text-[14px]">{icon}</span>
        {label}
      </div>
      <p className={`text-4xl font-black ${colorClass} tracking-tighter`}>{value}</p>
    </div>
  );
}

function ProgressBar({ label, percent, color }: { label: string, percent: number, color: string }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs font-black uppercase tracking-widest text-on-surface">
        <span>{label}</span>
        <span className={color.replace('bg-', 'text-')}>{percent.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden border border-outline-variant/10 shadow-inner">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}

function RecipientStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'sent': 
      return <span className="material-symbols-outlined text-primary" title="Delivered">check_circle</span>;
    case 'failed': 
      return <span className="material-symbols-outlined text-error" title="Failed">cancel</span>;
    case 'pending': 
      return <span className="material-symbols-outlined text-on-surface-variant/50" title="Pending">pending</span>;
    default: 
      return null;
  }
}
