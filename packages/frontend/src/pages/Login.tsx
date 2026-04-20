import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/client';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import heroImage from '../assets/hero.png';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const normalizeEmail = (val: string) => val.toLowerCase().trim();

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const submitData = { ...formData, email: normalizeEmail(formData.email) };
      const response = await api.post(endpoint, submitData);
      const { user } = response.data;
      setAuth(user);
      navigate('/');
    } catch (err: any) {
      setFormData(prev => ({ ...prev, password: '' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface-dim text-on-surface">
      {/* Left side: Hero Image & Branding */}
      <div className="hidden md:flex md:w-1/2 bg-purple-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 z-0 opacity-40">
          <img 
            src={heroImage} 
            alt="Hero" 
            className="w-full h-full object-cover mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-transparent to-blue-900"></div>
        </div>
        
        <div className="relative z-10 text-white max-w-lg">
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">
            Grow your audience with <span className="text-purple-300">precision.</span>
          </h1>
          <p className="text-xl text-purple-100 font-light">
            Mini Campaign Manager helps you orchestrate, automate, and analyze your marketing efforts in one powerful interface.
          </p>
          
          <div className="mt-12 flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-purple-900 bg-gray-300"></div>
              ))}
            </div>
            <span className="text-sm text-purple-200">Joined by 10k+ marketers</span>
          </div>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-container-low">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-bold text-on-surface">{isLogin ? 'Welcome back' : 'Create an account'}</h2>
            <p className="text-on-surface-variant mt-2 text-lg">
              {isLogin ? 'Log in to manage your campaigns' : 'Start your journey with us today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-high border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-on-surface placeholder:text-on-surface/30"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-on-surface-variant">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-high border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-on-surface placeholder:text-on-surface/30"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-on-surface-variant">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-high border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-on-surface placeholder:text-on-surface/30"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>



            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-70 shadow-lg shadow-primary/10"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-on-surface-variant">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-bold hover:underline"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
