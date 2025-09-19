import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MovieList from '../components/MovieList';
import moviesData from '../data/movies';

const HomePage = () => {
  const {isAuthenticated, logout} = useAuth();

  return (
    <div className="bg-gray-800 min-h-screen">
      <nav className="bg-black shadow-md p-4 justify-center flex space-x-4">
        <h1 className="text-3xl font-bold text-white">EasyCinema</h1>
        {isAuthenticated ? (
          <button onClick={logout} className="bg-red-500 text-white py-2 px-4 rounded-full hover:bg-red-600">
            Logout
          </button>
        ) : (
        <Link to="/login" className="bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700">
          Login
        </Link>
        )}
      </nav>
      <main className="container mx-auto">
        <MovieList movies={moviesData} />
      </main>
    </div>
  );
};

export default HomePage;