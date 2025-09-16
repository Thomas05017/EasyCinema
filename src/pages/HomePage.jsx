import React from 'react';
import MovieList from '../components/MovieList';
import moviesData from '../data/movies';

const HomePage = () => {
  return (
    <div className="bg-gray-800 min-h-screen">
      <header className="bg-black shadow-md p-4 text-center">
        <h1 className="text-3xl font-bold text-white">EasyCinema</h1>
      </header>
      <main className="container mx-auto">
        <MovieList movies={moviesData} />
      </main>
    </div>
  );
};

export default HomePage;