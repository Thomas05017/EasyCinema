import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SeatSelection from '../components/SeatSelection';

const MovieDetailPage = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedShowtime, setSelectedShowtime] = useState(null);

  const fetchMovie = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/movies/${id}`);
      if (!response.ok) {
        throw new Error('Film non trovato.');
      }
      const data = await response.json();
      setMovie(data);
      
      if (selectedShowtime) {
        const updatedShowtime = data.showtimes.find(s => s.id === selectedShowtime.id);
        if (updatedShowtime) setSelectedShowtime(updatedShowtime);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovie();
  }, [id]);

  const handleBookingSuccess = () => {
    fetchMovie();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 p-8">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-purple-500 rounded-full animate-spin animation-delay-150"></div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-200 mb-2">Caricamento dettagli film...</h2>
            <p className="text-slate-400">Stiamo preparando tutto per te</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-red-500/20 max-w-md mx-4 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-red-400 mb-2">Film Non Trovato</h3>
          <p className="text-slate-300 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Torna ai film
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString.slice(0, 5); // Remove seconds
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-3 text-slate-400 hover:text-indigo-400 font-semibold transition-all duration-200 group"
          >
            <div className="w-8 h-8 bg-slate-700 group-hover:bg-indigo-600 rounded-full flex items-center justify-center transition-all duration-200">
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </div>
            <span className="group-hover:translate-x-1 transition-transform duration-200">
              Torna ai film
            </span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Movie Hero Section */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-700/50 mb-8">
          <div className="flex flex-col lg:flex-row">
            {/* Movie Poster */}
            <div className="lg:w-1/3 relative">
              <div className="aspect-[2/3] lg:aspect-auto lg:h-full relative overflow-hidden">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-slate-900/60"></div>
              </div>
            </div>
            
            {/* Movie Info */}
            <div className="lg:w-2/3 p-8 lg:p-12 relative">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold px-4 py-2 rounded-full">
                      IN PROGRAMMAZIONE
                    </span>
                    <span className="bg-slate-700 text-slate-300 text-sm font-medium px-3 py-1 rounded-full">
                      {movie.year}
                    </span>
                  </div>
                  
                  <h1 className="text-4xl lg:text-5xl font-bold text-slate-100 mb-3 leading-tight">
                    {movie.title}
                  </h1>
                  
                  <div className="flex items-center gap-2 text-slate-400 mb-6">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    <span className="text-lg font-medium">Diretto da {movie.director}</span>
                  </div>
                </div>

                <div className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600/30">
                  <h3 className="text-slate-300 font-semibold mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Trama
                  </h3>
                  <p className="text-slate-200 leading-relaxed text-lg">
                    {movie.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Showtime Selection */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl p-8 lg:p-12 border border-slate-700/50 mb-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-100">Orari Spettacoli</h2>
              <p className="text-slate-400">Seleziona l'orario che preferisci</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {movie.showtimes.map((showtime) => {
              const isSelected = selectedShowtime?.id === showtime.id;
              return (
                <button
                  key={showtime.id}
                  onClick={() => setSelectedShowtime(showtime)}
                  className={`p-6 rounded-2xl text-left transition-all duration-300 transform hover:scale-105 border-2 ${
                    isSelected
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-400 shadow-lg shadow-indigo-500/25 text-white'
                      : 'bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 hover:border-indigo-400/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-3 h-3 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-400'}`}></div>
                    {isSelected && (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                      </svg>
                    )}
                  </div>
                  
                  <div className="mb-2">
                    <div className="text-2xl font-bold mb-1">
                      {formatTime(showtime.time)}
                    </div>
                    <div className={`text-sm font-medium capitalize ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {formatDate(showtime.date)}
                    </div>
                  </div>
                  
                  <div className={`text-xs font-semibold uppercase tracking-wide ${
                    isSelected ? 'text-indigo-100' : 'text-indigo-400'
                  }`}>
                    Disponibile
                  </div>
                </button>
              );
            })}
          </div>

          {!selectedShowtime && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-300 mb-2">Seleziona uno spettacolo</h3>
              <p className="text-slate-400">Scegli l'orario che preferisci per procedere con la prenotazione</p>
            </div>
          )}
        </div>

        {/* Seat Selection */}
        {selectedShowtime && (
          <div className="transform transition-all duration-500 ease-out animate-in fade-in slide-in-from-bottom-8">
            <SeatSelection showtime={selectedShowtime} onBookingSuccess={handleBookingSuccess} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieDetailPage;