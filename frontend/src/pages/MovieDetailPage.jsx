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
      <div className="flex justify-center items-center h-screen bg-gray-900 text-xl font-semibold text-white">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="32" strokeDashoffset="32">
              <animate attributeName="stroke-dashoffset" dur="1s" values="32;0;32" repeatCount="indefinite"/>
            </circle>
          </svg>
          Caricamento dettagli...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-xl font-semibold text-red-400">
        <div className="text-center">
          <p>Errore: {error}</p>
          <Link
            to="/"
            className="mt-4 inline-block text-blue-400 hover:text-blue-300 underline"
          >
            Torna alla lista film
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { 
      weekday: 'short',
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="bg-gray-800 p-4 shadow-lg">
        <div className="container mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Torna alla lista film
          </Link>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-1/3">
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full h-auto object-cover"
              />
            </div>
            
            <div className="lg:w-2/3 p-6 lg:p-8">
              <h1 className="text-4xl font-bold text-white mb-2">{movie.title}</h1>
              <p className="text-gray-400 text-lg mb-2">
                Diretto da {movie.director} ({movie.year})
              </p>
              <p className="text-gray-300 leading-relaxed mb-6">{movie.description}</p>
              
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">
                  Seleziona uno spettacolo
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {movie.showtimes.map((showtime) => {
                    const isSelected = selectedShowtime?.id === showtime.id;
                    return (
                      <button
                        key={showtime.id}
                        onClick={() => setSelectedShowtime(showtime)}
                        className={`p-4 rounded-lg text-sm font-semibold transition-all transform hover:scale-105
                          ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400'
                              : 'bg-gray-700 text-gray-300 hover:bg-blue-500 hover:text-white'
                          }`}
                      >
                        <div className="text-lg font-bold">{showtime.time}</div>
                        <div className="text-xs opacity-75">
                          {formatDate(showtime.date)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedShowtime && (
                <div className="transition-all duration-500 ease-in-out">

                  <SeatSelection showtime={selectedShowtime} onBookingSuccess={handleBookingSuccess} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;