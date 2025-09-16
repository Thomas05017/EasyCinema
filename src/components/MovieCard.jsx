import React from 'react';
import { Link } from 'react-router-dom';

const MovieCard = ({ movie }) => {
  return (
    <Link to={`/movies/${movie.id}`} className="block">
        <div className="bg-black rounded-lg shadow-lg overflow-hidden transform transition-transform hover:scale-105 transition-transform duration-300 ease-in-out">
            <img
                src={movie.poster}
                alt={movie.title}
                className="w-full h-100 object-cover"
            />
            <div className="p-4">
                <h3 className="text-xl font-bold mb-2 text-gray-100">{movie.title}</h3>
                <p className="text-gray-400 text-sm">{movie.director} ({movie.year})</p>
            </div>
        </div>
    </Link>
  );
};

export default MovieCard;