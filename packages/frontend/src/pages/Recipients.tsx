import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { Users, Mail, Search, MoreHorizontal } from 'lucide-react';

interface Recipient {
  id: number;
  name: string;
  email: string;
  created_at?: string;
  createdAt?: string;
}

export default function Recipients() {
  const { data: recipients, isLoading } = useQuery<Recipient[]>({
    queryKey: ['recipients'],
    queryFn: async () => {
      const response = await api.get('/recipients');
      return response.data;
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-on-surface">Recipient Roster</h1>
          <p className="text-on-surface-variant mt-2">Manage your verified communication targets.</p>
        </div>
        <div className="flex gap-4">
           <div className="px-4 py-2 rounded-xl bg-surface-container-high border border-outline-variant/10 flex items-center gap-2">
             <span className="text-primary font-bold text-xl">{recipients?.length || 0}</span>
             <span className="text-xs uppercase tracking-widest text-on-surface-variant">Total Records</span>
           </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-outline-variant/10 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-outline-variant/10 bg-surface-container-low/50 flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
            <input 
              type="text" 
              placeholder="Filter recipients..." 
              className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none w-64 transition-all text-on-surface"
            />
          </div>
          <button className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform active:scale-95">
            <Users size={18} />
            Import CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" data-testid="recipients-table">
            <thead>
              <tr className="bg-surface-container-highest/30">
                <th className="px-6 py-4 text-xs uppercase tracking-widest text-on-surface-variant font-black">Identity</th>
                <th className="px-6 py-4 text-xs uppercase tracking-widest text-on-surface-variant font-black">Email Vector</th>
                <th className="px-6 py-4 text-xs uppercase tracking-widest text-on-surface-variant font-black">Onboarded</th>
                <th className="px-6 py-4 text-xs uppercase tracking-widest text-on-surface-variant font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse" data-testid="recipients-loader">
                    <td className="px-6 py-6"><div className="h-4 bg-surface-container-highest rounded w-32"></div></td>
                    <td className="px-6 py-6"><div className="h-4 bg-surface-container-highest rounded w-48"></div></td>
                    <td className="px-6 py-6"><div className="h-4 bg-surface-container-highest rounded w-24"></div></td>
                    <td className="px-6 py-6 text-right"><div className="h-4 bg-surface-container-highest rounded w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : recipients?.map((recipient) => (
                <tr key={recipient.id} className="hover:bg-surface-container-high/40 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center text-primary font-bold border border-primary/10">
                        {recipient.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-on-surface group-hover:text-primary transition-colors">{recipient.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <Mail size={14} className="opacity-50" />
                      <span className="text-sm font-medium">{recipient.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-mono text-on-surface-variant/60">
                      {new Date(recipient.created_at || recipient.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors text-on-surface-variant hover:text-on-surface">
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
