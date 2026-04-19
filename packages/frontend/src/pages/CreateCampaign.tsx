import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import type { Recipient } from '../types';
import { Link } from 'react-router-dom';
import { useToastStore } from '../store/useToastStore';

interface RecipientsListProps {
  selectedRecipients: number[];
  onToggle: (id: number) => void;
}

const RecipientsList = memo(function RecipientsList({ selectedRecipients, onToggle }: RecipientsListProps) {
  const { data: recipients, isLoading } = useQuery<Recipient[]>({
    queryKey: ['recipients'],
    queryFn: async () => {
      const res = await api.get('/recipients');
      return res.data;
    },
    staleTime: 30000,
  });

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      {isLoading ? (
        <div className="flex items-center justify-center py-8" data-testid="recipient-list-loader">
          <span className="material-symbols-outlined animate-spin text-primary">sync</span>
        </div>
      ) : recipients?.map((recipient) => (
        <div 
          key={recipient.id}
          onClick={() => onToggle(recipient.id)}
          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
            selectedRecipients.includes(recipient.id)
              ? 'bg-primary-container/20 border-primary/50 shadow-[0_0_15px_rgba(62,73,187,0.15)] translate-x-1'
              : 'bg-surface-container-low border-outline-variant/10 hover:border-primary/30 hover:bg-surface-container-high'
          }`}
        >
          <div className="flex flex-col min-w-0">
            <span className={`text-sm font-semibold truncate tracking-tight ${selectedRecipients.includes(recipient.id) ? 'text-on-surface' : 'text-on-surface-variant'}`}>{recipient.name}</span>
            <span className="text-[10px] text-on-surface-variant/60 truncate uppercase tracking-widest font-bold">{recipient.email}</span>
          </div>
          {selectedRecipients.includes(recipient.id) ? (
            <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
          ) : (
            <div className="w-[18px] h-[18px] rounded-full border border-outline-variant/30 flex-shrink-0" />
          )}
        </div>
      ))}
      {recipients?.length === 0 && !isLoading && (
        <div className="text-center py-8 text-on-surface-variant text-sm font-medium tracking-tight">
          No recipients yet.
        </div>
      )}
    </div>
  );
});

export default function CreateCampaign() {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
  });
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [isCreatingRecipient, setIsCreatingRecipient] = useState(false);
  const [newRecipient, setNewRecipient] = useState({ name: '', email: '' });

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const toggleRecipient = (id: number) => {
    setSelectedRecipients(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  // Create Campaign Mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/campaigns', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      addToast('Campaign draft initialized successfully.', 'success');
      navigate('/');
    },
  });

  // Create Recipient Mutation
  const createRecipientMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/recipients', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recipients'] });
      addToast('New recipient target added to matrix.', 'success');
      setSelectedRecipients([...selectedRecipients, data.id]);
      setNewRecipient({ name: '', email: '' });
      setIsCreatingRecipient(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRecipients.length === 0) {
      alert('Please select at least one recipient');
      return;
    }
    createCampaignMutation.mutate({
      ...formData,
      recipientIds: selectedRecipients,
    });
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group">
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
        <span className="text-sm font-semibold tracking-tight">Back to Dashboard</span>
      </Link>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Main Form */}
        <div className="flex-1 space-y-6">
          <div className="glass-panel p-8 rounded-2xl border border-outline-variant/10 shadow-[0_24px_48px_rgba(6,14,32,0.4)]">
            <h1 className="text-2xl font-black text-on-surface mb-6 tracking-tight">New Campaign</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold tracking-tight text-on-surface-variant">Campaign Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant/50 text-[20px]">title</span>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Summer Sale 2026"
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/10 rounded-xl text-on-surface focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all outline-none"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    data-testid="campaign-name-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold tracking-tight text-on-surface-variant">Email Subject</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant/50 text-[20px]">mail</span>
                  <input
                    type="text"
                    required
                    placeholder="Hot deals inside! 🔥"
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/10 rounded-xl text-on-surface focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all outline-none"
                    value={formData.subject}
                    onChange={(e) => handleFormChange('subject', e.target.value)}
                    data-testid="campaign-subject-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold tracking-tight text-on-surface-variant">Email Content (HTML supported)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant/50 text-[20px]">description</span>
                  <textarea
                    required
                    rows={8}
                    placeholder="Hello {{name}}, we have a special offer for you..."
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/10 rounded-xl text-on-surface focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all outline-none resize-none"
                    value={formData.body}
                    onChange={(e) => handleFormChange('body', e.target.value)}
                    data-testid="campaign-body-textarea"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createCampaignMutation.isPending}
                data-testid="create-campaign-button"
                className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-black rounded-xl shadow-[0_10px_30px_rgba(62,73,187,0.4)] hover:shadow-[0_10px_40px_rgba(62,73,187,0.6)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70 mt-8 relative overflow-hidden"
              >
                {createCampaignMutation.isPending ? (
                  <span className="material-symbols-outlined animate-spin text-on-primary">sync</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">send</span>
                    <span>Create Campaign (Draft)</span>
                    <div className="absolute inset-0 rounded-xl bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Recipient Selection - Extracted to separate memoized component */}
        <div className="w-full md:w-96 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 shadow-[0_24px_48px_rgba(6,14,32,0.4)] sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-on-surface tracking-tight">Recipients</h3>
              <button 
                onClick={() => setIsCreatingRecipient(!isCreatingRecipient)}
                className="p-1.5 text-primary hover:bg-surface-container-high rounded-lg transition-colors border border-transparent hover:border-outline-variant/10"
                title="Add New Recipient"
                data-testid="add-recipient-toggle"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
              </button>
            </div>

            {isCreatingRecipient && (
              <div className="mb-6 p-4 bg-surface-container-high rounded-xl border border-primary/30 space-y-3 shadow-inner">
                <input
                  type="text"
                  placeholder="Name"
                  data-testid="new-recipient-name"
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/10 rounded-lg text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary placeholder-on-surface-variant/50"
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                />
                <input
                  type="email"
                  placeholder="Email"
                  data-testid="new-recipient-email"
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/10 rounded-lg text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary placeholder-on-surface-variant/50"
                  value={newRecipient.email}
                  onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => createRecipientMutation.mutate(newRecipient)}
                    disabled={createRecipientMutation.isPending || !newRecipient.email}
                    data-testid="add-recipient-submit"
                    className="flex-1 bg-primary text-on-primary text-xs font-black py-2 rounded-lg hover:bg-primary-container disabled:opacity-50 transition-colors"
                  >
                    Add
                  </button>
                  <button 
                    onClick={() => setIsCreatingRecipient(false)}
                    className="flex-1 bg-surface-container-highest text-on-surface-variant text-xs font-bold py-2 border border-outline-variant/20 rounded-lg hover:bg-surface-container-highest/50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <RecipientsList 
              selectedRecipients={selectedRecipients} 
              onToggle={toggleRecipient} 
            />

            <div className="mt-6 pt-4 border-t border-outline-variant/10">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant font-semibold tracking-tight">Selected:</span>
                <span className="font-black text-primary">{selectedRecipients.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}