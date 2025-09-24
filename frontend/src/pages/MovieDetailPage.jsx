import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SeatSelection from '../components/SeatSelection';

const MovieDetailPage = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedShowtime, setSelectedShowtime] = useState(null);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/movies/${id}`);
        if (!response.ok) {
          throw new Error('Film non trovato.');
        }
        const data = await response.json();
        setMovie(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold">
        Caricamento dettagli...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold text-red-500">
        Errore: {error}
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <Link
        to="/"
        className="text-blue-500 hover:underline mb-4 inline-block font-semibold"
      >
        &larr; Torna alla lista film
      </Link>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full md:w-1/3 object-cover"
        />
        <div className="p-6 md:p-8 flex-grow">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{movie.title}</h1>
          <p className="text-gray-600 text-lg mb-4">
            {movie.director} ({movie.year})
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">{movie.description}</p>
          <h2 className="text-2xl font-bold mt-6 mb-4 text-gray-800">
            Seleziona uno spettacolo
          </h2>
          <div className="flex flex-wrap gap-4">
            {movie.showtimes.map((showtime) => (
              <button
                key={showtime.id}
                onClick={() => setSelectedShowtime(showtime)}
                className={`py-2 px-4 rounded-full text-sm font-semibold transition-colors
                  ${
                    selectedShowtime?.id === showtime.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-blue-500 hover:text-white'
                  }`}
              >
                {showtime.time} ({new Date(showtime.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })})
              </button>
            ))}
          </div>
          {selectedShowtime && (
            <div className="mt-8">
              <SeatSelection showtime={selectedShowtime} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;