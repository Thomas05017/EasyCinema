import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      
      if (!username.trim() || !password.trim()) {
          setError('Per favore, compila tutti i campi');
          return;
      }

      setIsLoading(true);

      try {
          const response = await fetch('http://localhost:5000/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password }),
          });

          const data = await response.json();

          if (response.ok) {
              login(data.token);
              navigate('/', { replace: true });
          } else {
              setError(data.message || 'Errore durante il login');
          }
      } catch (error) {
          console.error('Errore di login:', error);
          setError('Errore di connessione. Riprova più tardi.');
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-600/10 to-transparent rounded-full transform rotate-12"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-600/10 to-transparent rounded-full transform -rotate-12"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Back to Home */}
        <Link 
            to="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors duration-200 mb-8 group"
        >
            <svg className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Torna alla home
        </Link>

        {/* Login Card */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8">
          {/* Header */}
          <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-100 mb-2">Accedi al tuo Account</h1>
              <p className="text-slate-400">Inserisci le tue credenziali per continuare</p>
          </div>

          {/* Error Message */}
          {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                  <div className="w-5 h-5 text-red-400 flex-shrink-0">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                  </div>
                  <span className="text-red-300 text-sm">{error}</span>
              </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
              <label className="block text-gray-700 mb-2" htmlFor="username">Username</label>
              <input
                  type="text"
                  id="username"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="mb-6">
                <label className="block text-gray-700 mb-2" htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
                Accedi
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;