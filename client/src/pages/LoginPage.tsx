import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      addToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const testAccounts = [
    { username: 'fin.user', dept: 'Finance', role: 'Department User' },
    { username: 'hr.user', dept: 'HR', role: 'Department User' },
    { username: 'ceo.user', dept: 'CEO Office', role: 'Full Access' },
    { username: 'compliance.user', dept: 'Compliance', role: 'Full Access' },
    { username: 'admin', dept: 'System', role: 'Administrator' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-pattern bg-[#F8F6F3] p-4">
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-deyaar-orange/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-deyaar-brown/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Login Card */}
        <div className="card overflow-hidden shadow-2xl shadow-deyaar-orange/10">
          {/* Header with Logo */}
          <div className="bg-gradient-to-br from-deyaar-orange to-deyaar-brown px-8 py-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="white" />
                </pattern>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>
            <div className="relative">
              {/* Deyaar Logo - White version for dark background */}
              <div className="mb-4">
                <img 
                  src="/logo.png" 
                  alt="Deyaar" 
                  className="h-12 w-auto mx-auto brightness-0 invert"
                />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Deyaar Letter Management</h1>
              <p className="text-white/80 text-sm">Register and manage official letters</p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="form-group">
                <label className="form-label form-label-required">Username</label>
                <div className="relative">
                  <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="input-field pl-12"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label form-label-required">Password</label>
                <div className="relative">
                  <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field pl-12"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            {/* Test Accounts */}
            <div className="mt-8 p-5 bg-deyaar-beige-light rounded-2xl border border-deyaar-beige">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-deyaar-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs font-bold text-deyaar-brown uppercase tracking-wider">Test Accounts</p>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Password: <span className="font-mono font-semibold text-deyaar-dark bg-white px-2 py-0.5 rounded">password123</span>
              </p>
              <div className="space-y-2">
                {testAccounts.map((account) => (
                  <button
                    key={account.username}
                    onClick={() => {
                      setUsername(account.username);
                      setPassword('password123');
                    }}
                    className="w-full flex items-center justify-between p-2.5 bg-white rounded-xl 
                             hover:border-deyaar-orange/30 hover:shadow-sm border border-transparent
                             transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-deyaar-beige flex items-center justify-center">
                        <span className="text-xs font-bold text-deyaar-brown">
                          {account.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-deyaar-dark group-hover:text-deyaar-orange transition-colors">
                        {account.username}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{account.dept}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Deyaar Development PJSC. All rights reserved.
        </p>
      </div>
    </div>
  );
}
