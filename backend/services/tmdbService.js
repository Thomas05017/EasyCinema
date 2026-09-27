const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const tmdbFetch = async (path, params = {}) => {
    const url = new URL(`${TMDB_BASE_URL}${path}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Errore TMDB (${response.status}): ${await response.text()}`);
    }

    return response.json();
};

// Mappa genre_id -> nome genere (in italiano)
let genreMapCache = null;
const getGenreMap = async () => {
    if (genreMapCache) return genreMapCache;

    const data = await tmdbFetch('/genre/movie/list', {
        language: process.env.TMDB_LANGUAGE || 'it-IT'
    });

    genreMapCache = new Map(data.genres.map(g => [g.id, g.name]));
    return genreMapCache;
};

const fetchNowPlaying = async (maxResults = 10) => {
    const data = await tmdbFetch('/movie/now_playing', {
        language: process.env.TMDB_LANGUAGE || 'it-IT',
        region: process.env.TMDB_REGION || 'IT',
        page: 1
    });

    return data.results.slice(0, maxResults);
};

const fetchDirector = async (movieId) => {
    const data = await tmdbFetch(`/movie/${movieId}/credits`);
    const director = data.crew.find(person => person.job === 'Director');
    return director ? director.name : 'Regista sconosciuto';
};

const mapToLocalSchema = async (tmdbMovie) => {
    const genreMap = await getGenreMap();
    const director = await fetchDirector(tmdbMovie.id);

    const genreNames = (tmdbMovie.genre_ids || [])
        .map(id => genreMap.get(id))
        .filter(Boolean)
        .join(', ');

    return {
        tmdb_id: tmdbMovie.id,
        title: tmdbMovie.title,
        genres: genreNames || 'Non specificato',
        description: tmdbMovie.overview || 'Descrizione non disponibile.',
        director,
        year: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : null,
        poster: tmdbMovie.poster_path ? `${TMDB_IMAGE_BASE_URL}${tmdbMovie.poster_path}` : null
    };
};

module.exports = { fetchNowPlaying, mapToLocalSchema };