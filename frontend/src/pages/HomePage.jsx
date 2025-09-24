import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MovieList from '../components/MovieList';

const HomePage = () => {
  const { isAuthenticated, logout } = useAuth();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/movies');
        if (!response.ok) {
          throw new Error('Errore nel recupero dei film');
        }
        const data = await response.json();
        setMovies(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold">
        Caricamento film...
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
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">EasyCinema</h1>
        {isAuthenticated ? (
          <button
            onClick={logout}
            className="bg-red-500 text-white py-2 px-4 rounded-full hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        ) : (
          <Link
            to="/login"
            className="bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition-colors"
          >
            Login
          </Link>
        )}
      </header>
      <main className="container mx-auto p-6">
        <MovieList movies={movies} />
      </main>
    </div>
  );
};

export default HomePage;