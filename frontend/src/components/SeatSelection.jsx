import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SeatSelection = ({ showtime, onBookingSuccess }) => {
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSeatClick = (row, col) => {
        if (showtime.seats[row][col] === 1) {
            return;
        }
        
        const seatKey = `${row}-${col}`;
        
        if (selectedSeats.includes(seatKey))
            setSelectedSeats(selectedSeats.filter(seat => seat !== seatKey));
        else
            setSelectedSeats([...selectedSeats, seatKey]);
    };

    const handleBooking = async () => {
        if (selectedSeats.length === 0) {
            setError('Seleziona almeno un posto per continuare');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    showtimeId: showtime.id,
                    selectedSeats: selectedSeats
                })
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                navigate('/login');
                return;
            }

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => {
                    setSelectedSeats([]);
                    setSuccess(false);
                    if (onBookingSuccess) onBookingSuccess();
                }, 2000);
            } else {
                setError(data.message || 'Errore durante la prenotazione. Riprova più tardi.');
            }
        } catch (error) {
            console.error('Errore durante la prenotazione:', error);
            setError('Errore di connessione. Verifica la tua connessione internet.');
        } finally {
            setIsLoading(false);
        }
    };

    const getSeatInfo = (row, col) => {
        const seatNumber = `${String.fromCharCode(65 + row)}${col + 1}`;
        const isBooked = showtime.seats[row][col] === 1;
        const isSelected = selectedSeats.includes(`${row}-${col}`);

        if (isBooked) return { 
            title: `Posto ${seatNumber} - Occupato`, 
            class: 'bg-red-500/80 border-red-400 cursor-not-allowed',
            icon: 'occupied'
        };
        if (isSelected) return { 
            title: `Posto ${seatNumber} - Selezionato`, 
            class: 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400 shadow-lg transform scale-110',
            icon: 'selected'
        };
        return { 
            title: `Posto ${seatNumber} - Disponibile`, 
            class: 'bg-emerald-500/80 hover:bg-emerald-400 border-emerald-400/60 hover:border-emerald-300 cursor-pointer hover:shadow-lg hover:scale-105',
            icon: 'available'
        };
    };

    const totalPrice = selectedSeats.length * 8.50; // Assuming €8.50 per seat

    return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700/50 p-8 lg:p-12">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                </div>
                <div>
                    <h3 className="text-3xl font-bold text-slate-100">Seleziona i tuoi posti</h3>
                    <p className="text-slate-400">Scegli i posti migliori per la tua esperienza</p>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-6 mb-8 p-6 bg-slate-700/30 rounded-2xl border border-slate-600/30">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-emerald-500 rounded-lg border-2 border-emerald-400 shadow-sm"></div>
                    <span className="text-slate-300 font-medium">Disponibile</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg border-2 border-indigo-400 shadow-lg"></div>
                    <span className="text-slate-300 font-medium">Selezionato</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-red-500 rounded-lg border-2 border-red-400 shadow-sm"></div>
                    <span className="text-slate-300 font-medium">Occupato</span>
                </div>
            </div>

            {/* Screen */}
            <div className="mb-12">
                <div className="relative max-w-2xl mx-auto">
                    <div className="h-3 bg-gradient-to-r from-transparent via-slate-300 to-transparent rounded-full mb-3 shadow-lg"></div>
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                        <span>SCHERMO</span>
                    </div>
                </div>
            </div>

            {/* Seats Grid */}
            <div className="flex flex-col items-center mb-8">
                <div className="inline-block bg-slate-700/20 rounded-3xl p-8 border border-slate-600/30">
                    {showtime.seats.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex items-center gap-3 mb-3 last:mb-0">
                            {/* Row Label */}
                            <div className="w-8 h-8 flex items-center justify-center text-slate-400 font-bold text-sm bg-slate-700/50 rounded-lg mr-2">
                                {String.fromCharCode(65 + rowIndex)}
                            </div>
                            
                            {/* Seats in Row */}
                            {row.map((seatStatus, colIndex) => {
                                const seatInfo = getSeatInfo(rowIndex, colIndex);
                                return (
                                    <button
                                        key={`${rowIndex}-${colIndex}`}
                                        onClick={() => handleSeatClick(rowIndex, colIndex)}
                                        className={`w-10 h-10 rounded-xl border-2 transition-all duration-200 font-bold text-xs text-white ${seatInfo.class}`}
                                        title={seatInfo.title}
                                        disabled={seatStatus === 1 || isLoading}
                                    >
                                        {colIndex + 1}
                                    </button>
                                );
                            })}
                            
                            {/* Row Label (Right) */}
                            <div className="w-8 h-8 flex items-center justify-center text-slate-400 font-bold text-sm bg-slate-700/50 rounded-lg ml-2">
                                {String.fromCharCode(65 + rowIndex)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Selected Seats Summary */}
            {selectedSeats.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-slate-200 font-semibold mb-1">Posti selezionati:</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedSeats.map(seat => {
                                    const [row, col] = seat.split('-').map(Number);
                                    const seatLabel = `${String.fromCharCode(65 + row)}${col + 1}`;
                                    return (
                                        <span key={seat} className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm font-medium border border-indigo-500/30">
                                            {seatLabel}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-slate-200">€{totalPrice.toFixed(2)}</div>
                            <div className="text-sm text-slate-400">{selectedSeats.length} {selectedSeats.length === 1 ? 'posto' : 'posti'}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                    <div className="w-6 h-6 text-red-400 flex-shrink-0">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <span className="text-red-300 font-medium">{error}</span>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                    <div className="w-6 h-6 text-emerald-400 flex-shrink-0">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        </svg>
                    </div>
                    <span className="text-emerald-300 font-medium">
                        Prenotazione completata con successo! 🎉
                    </span>
                </div>
            )}

            {/* Booking Button */}
            <div className="flex justify-center">
                <button
                    onClick={handleBooking}
                    disabled={selectedSeats.length === 0 || isLoading || success}
                    className={`font-bold py-4 px-8 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3 text-lg ${
                        selectedSeats.length === 0 || isLoading || success
                            ? 'bg-slate-600 text-slate-400 cursor-not-allowed hover:scale-100 shadow-none'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                    }`}
                >
                    {isLoading ? (
                        <>
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            <span>Prenotando...</span>
                        </>
                    ) : success ? (
                        <>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            <span>Prenotato!</span>
                        </>
                    ) : selectedSeats.length === 0 ? (
                        <>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            </svg>
                            <span>Seleziona i posti</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                            </svg>
                            <span>Prenota {selectedSeats.length} {selectedSeats.length === 1 ? 'posto' : 'posti'} - €{totalPrice.toFixed(2)}</span>
                        </>
                    )}
                </button>
            </div>

            {/* Info Section */}
            <div className="mt-8 pt-6 border-t border-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                            </svg>
                        </div>
                        <p className="text-slate-300 text-sm font-medium">Pagamento sicuro</p>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                        <p className="text-slate-300 text-sm font-medium">Conferma istantanea</p>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                            </svg>
                        </div>
                        <p className="text-slate-300 text-sm font-medium">Migliore esperienza</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SeatSelection;