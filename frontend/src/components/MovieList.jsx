import React from 'react';
import MovieCard from './MovieCard';

const MovieList = ({ movies }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 lg:gap-8">
      {movies.map((movie, index) => (
        <div 
          key={movie.id}
          className="transform transition-all duration-500 hover:scale-105"
          style={{
            animationDelay: `${index * 100}ms`
          }}
        >
          <MovieCard movie={movie} />
        </div>
      ))}
    </div>
  );
};

export default MovieList;