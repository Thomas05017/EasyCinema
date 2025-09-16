import React from 'react';
import { useParams, Link } from 'react-router-dom';
import moviesData from '../data/movies';

const MovieDetailPage = () => {
  const { id } = useParams();
  const movie = moviesData.find(m => m.id === parseInt(id));

  if (!movie) {
    return (
        <>
            <header className="bg-black shadow-md p-4 text-center">
                <h1 className="text-3xl font-bold text-white">EasyCinema</h1>
            </header>

            <div className="min-h-screen bg-gray-800 text-center p-8">
                <h1 className="text-2xl font-bold text-gray-100 mb-4">Film non trovato</h1>
                <Link to="/" className="text-blue-300 hover:underline">Torna alla lista film</Link>
            </div>
        </>
    );
  }

  return (
    <>
        <header className="bg-black shadow-md p-4 text-center">
            <Link to="/"><h1 className="text-3xl font-bold text-white">EasyCinema</h1></Link>
        </header>

        <div className="bg-gray-800 min-h-screen p-8">
            <div className="max-sm:m-4 max-lg:m-16 bg-black rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row">
                <img
                    src={movie.poster}
                    alt={movie.title}
                    className="object-cover"
                />
                <div className="p-6 md:p-8">
                    <h1 className="text-4xl font-bold text-gray-100 mb-2">{movie.title}</h1>
                    <p className="text-gray-100 text-lg mb-4">{movie.director} ({movie.year})</p>
                    <p className="text-gray-200 leading-relaxed mb-4">{movie.genres}</p>
                    <p className="text-gray-300 leading-relaxed">{movie.description}</p>
                </div>
            </div>
        </div>
    </>
  );
};

export default MovieDetailPage;