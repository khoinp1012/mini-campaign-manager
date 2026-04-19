import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import type { Campaign, CampaignStats } from '../types';
import { Link } from 'react-router-dom';
import CampaignTable from '../components/CampaignTable';
import { Skeleton } from '../components/Skeleton';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Dashboard() {
  const [page, setPage] = useState(1);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);

  const { isLoading: loadingCampaigns, isFetching: fetchingMore } = useQuery({
    queryKey: ['campaigns', page],
    queryFn: async () => {
      const res = await api.get(`/campaigns?page=${page}&limit=5`);
      const newData: Campaign[] = res.data?.campaigns || [];
      setAllCampaigns((prev) => {
        if (page === 1) {
          // Full reset: replace list (handles deletes & invalidation)
          return newData;
        }
        // Load-more: append only new IDs
        const existingIds = new Set((prev || []).map(c => c.id));
        const filtered = newData.filter((c: Campaign) => !existingIds.has(c.id));
        return [...(prev || []), ...filtered];
      });
      return res.data;
    },
  });

  const { data: stats, isLoading: loadingStats } = useQuery<CampaignStats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await api.get('/campaigns/stats');
      return res.data;
    },
  });

  // Mocked growth data based on total audience for "WOW" factor
  const chartsData = useMemo(() => {
    const total = stats?.total || 0;
    return [
      { name: 'Mon', value: Math.round(total * 0.4) },
      { name: 'Tue', value: Math.round(total * 0.45) },
      { name: 'Wed', value: Math.round(total * 0.6) },
      { name: 'Thu', value: Math.round(total * 0.55) },
      { name: 'Fri', value: Math.round(total * 0.8) },
      { name: 'Sat', value: Math.round(total * 0.85) },
      { name: 'Sun', value: total },
    ];
  }, [stats?.total]);

  const pieData = useMemo(() => ([
    { name: 'Delivered', value: stats?.sent || 0, color: 'var(--color-primary)' },
    { name: 'Failed', value: stats?.failed || 0, color: 'var(--color-error, #f87171)' },
    { name: 'Opened', value: stats?.opened || 0, color: 'var(--color-secondary)' },
  ]), [stats]);

  const serverHasMore = stats ? allCampaigns.length < stats.total : false;

  const handleLoadMore = () => {
    setPage(p => p + 1);
  };

  if (loadingStats && !stats) {
    return (
      <div className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 lg:col-span-1" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero Section: Metrics Bento Grid */}
      <section>
        <div className="flex justify-between items-end mb-8 px-2 md:px-0">
          <div>
            <h3 className="text-3xl font-black tracking-tighter text-on-surface mb-2">Campaign Performance</h3>
            <p className="text-on-surface-variant text-sm font-medium">Live data visualization for all active segments</p>
          </div>
          <Link to="/campaigns/new" className="group relative px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl shadow-[0_10px_30px_rgba(62,73,187,0.4)] hover:shadow-[0_10px_40px_rgba(62,73,187,0.6)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2">
            <span className="material-symbols-outlined">add</span>
            Create New Campaign
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Audience Reach" 
            value={(stats?.total || 0).toLocaleString()} 
            icon="hub" 
            trend="+12.4%" 
            trendIcon="trending_up"
            trendColor="text-secondary"
            colorTheme="primary"
          />
          <StatCard 
            title="Emails Dispatched" 
            value={(stats?.sent || 0).toLocaleString()} 
            icon="send" 
            trend="+5.2%" 
            trendIcon="trending_up"
            trendColor="text-secondary"
            colorTheme="primary"
          />
          <StatCard 
            title="Unique Open Rate" 
            value={`${stats?.open_rate?.toFixed(1) || 0}%`} 
            icon="drafts" 
            trend="Above Average" 
            trendIcon="arrow_upward"
            trendColor="text-emerald-400"
            colorTheme="secondary"
          />
          <StatCard 
            title="Delivery Success" 
            value={`${stats?.send_rate?.toFixed(1) || 0}%`} 
            icon="check_circle" 
            trend="Optimal Stability" 
            trendIcon="verified"
            trendColor="text-on-surface-variant"
            colorTheme="primary"
          />
        </div>
      </section>

      {/* Middle Content: Charts & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Delivery Performance Donut */}
        <div className="lg:col-span-1 glass-panel p-8 rounded-2xl border border-outline-variant/10 flex flex-col items-center justify-between">
          <h4 className="text-lg font-bold text-on-surface self-start mb-4">Delivery Health</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-surface-container-high)', border: 'none', borderRadius: '12px', color: 'var(--color-on-surface)' }}
                  itemStyle={{ color: 'var(--color-on-surface)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full space-y-2 mt-4">
               {pieData.map((d) => (
                 <div key={d.name} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></span>
                      <span className="text-on-surface-variant font-medium">{d.name}</span>
                    </div>
                    <span className="font-black text-on-surface">{d.value.toLocaleString()}</span>
                 </div>
               ))}
          </div>
        </div>

        {/* Growth Area Chart */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-2xl border border-outline-variant/10 flex flex-col justify-between overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-lg font-bold text-on-surface">Growth Projection</h4>
              <p className="text-xs text-on-surface-variant font-medium">Audience expansion (Normalized view)</p>
            </div>
            <div className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-[10px] font-black tracking-widest px-3 py-1.5 text-on-surface uppercase">
              Last 7 Days
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartsData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-outline-variant)" opacity={0.2} />
                <XAxis 
                   dataKey="name" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fontSize: 10, fill: 'var(--color-on-surface-variant)', fontWeight: 'bold' }} 
                   dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-surface-container-high)', border: 'none', borderRadius: '12px', color: 'var(--color-on-surface)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--color-primary)" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-2 md:px-0">
          <h4 className="text-2xl font-black tracking-tight text-on-surface uppercase">Recent Streams</h4>
          <Link to="/campaigns" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 transition-all hover:bg-primary/20">
            Explorer All
          </Link>
        </div>
        <CampaignTable 
          campaigns={allCampaigns} 
          isLoading={loadingCampaigns} 
          onActionSuccess={() => setPage(1)}
        />
        {(serverHasMore || fetchingMore) && (
          <div className="flex justify-center mt-8">
            <button 
              onClick={handleLoadMore}
              disabled={fetchingMore}
              className="px-8 py-3 rounded-xl border border-outline-variant/30 text-on-surface font-bold text-sm hover:bg-surface-container-highest transition-all flex items-center gap-2 group disabled:opacity-50"
            >
                {fetchingMore ? (
                  <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-sm group-hover:translate-y-0.5 transition-transform">expand_more</span>
                )}
                <span>Load More Records</span>
              </button>
            </div>
          )}
      </section>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendIcon, trendColor, colorTheme }: any) {
  const isPrimary = colorTheme === 'primary';
  const iconBgClass = isPrimary ? 'bg-primary-container/20 text-primary' : 'bg-secondary-container/20 text-secondary';
  
  return (
    <div className="glass-panel p-6 rounded-xl border border-outline-variant/10 hover:border-primary/30 transition-all duration-500 group hover-lift">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-2 rounded-lg ${iconBgClass}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest min-h-[30px] flex items-center text-right w-2/3 leading-tight justify-end">{title}</span>
      </div>
      <div className="space-y-1">
        <p className="text-4xl font-black text-on-surface tracking-tighter truncate">{value}</p>
        <div className={`flex items-center gap-1.5 ${trendColor} text-xs font-bold uppercase tracking-wider`}>
          {trendIcon && <span className="material-symbols-outlined text-sm">{trendIcon}</span>}
          <span>{trend}</span>
        </div>
      </div>
    </div>
  );
}
