import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const MyBookingsPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/my-bookings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('token');
                    navigate('/login');
                    return;
                }

                if (!response.ok) {
                    throw new Error('Errore nel recupero delle prenotazioni.');
                }

                const data = await response.json();
                setBookings(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [navigate]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatBookingDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTime = (timeString) => timeString.slice(0, 5);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 p-8">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-500 rounded-full animate-spin animation-delay-150"></div>
                    </div>
                    <h2 className="text-xl font-medium text-slate-200">Caricamento prenotazioni...</h2>
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
                    <h3 className="text-xl font-bold text-red-400 mb-2">Errore</h3>
                    <p className="text-slate-300 mb-6">{error}</p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200"
                    >
                        Torna alla home
                    </Link>
                </div>
            </div>
        );
    }

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
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100">Le mie prenotazioni</h1>
                        <p className="text-slate-400">
                            {bookings.length === 0
                                ? 'Nessuna prenotazione effettuata'
                                : `${bookings.length} ${bookings.length === 1 ? 'prenotazione' : 'prenotazioni'}`}
                        </p>
                    </div>
                </div>

                {bookings.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-300 mb-2">Non hai ancora prenotazioni</h3>
                        <p className="text-slate-400 mb-6">Sfoglia i film disponibili e prenota il tuo primo posto</p>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                        >
                            Scopri i film
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {bookings.map((booking) => (
                            <div
                                key={booking.id}
                                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-700/50"
                            >
                                <div className="flex">
                                    <div className="w-28 flex-shrink-0">
                                        <img
                                            src={booking.movie.poster}
                                            alt={booking.movie.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="p-5 flex-1 space-y-3">
                                        <h3 className="text-lg font-bold text-slate-100 leading-tight">
                                            {booking.movie.title}
                                        </h3>

                                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                                            <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                            </svg>
                                            <span className="capitalize">{formatDate(booking.showtime.date)}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                                            <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                            </svg>
                                            <span>{formatTime(booking.showtime.time)}</span>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {booking.seats.map((seat, idx) => (
                                                <span
                                                    key={idx}
                                                    className="bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full text-xs font-medium border border-indigo-500/30"
                                                >
                                                    {String.fromCharCode(64 + seat.row)}{seat.col}
                                                </span>
                                            ))}
                                        </div>

                                        <p className="text-slate-500 text-xs pt-1">
                                            Prenotato il {formatBookingDate(booking.bookingDate)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyBookingsPage;