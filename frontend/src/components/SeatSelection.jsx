import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SeatSelection = ({ showtime, onBookingSuccess }) => {
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
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
            setError('Seleziona almeno un posto');
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
            }
            const data = await response.json();

            if (response.ok) {
                alert(`Prenotazione effettuata con successo! ${data.seatsBooked} posti prenotati.`);
                setSelectedSeats([]);

                if (onBookingSuccess) onBookingSuccess();

            } else {
                setError('Errore durante la prenotazione');
            }
        } catch (error) {
            console.error('Errore durante la prenotazione:', error);
            setError('Errore durante la prenotazione');
        } finally {
            setIsLoading(false);
        }
    };

    const getSeatInfo = (row, col) => {
        const seatNumber = `${row + 1}-${col + 1}`;
        const isBooked = showtime.seats[row][col] === 1;
        const isSelected = selectedSeats.includes(`${row}-${col}`);

        if (isBooked) return { title: 'Posto occupato', class: 'bg-red-500 cursor-not-allowed' };
        if (isSelected) return { title: `Posto ${seatNumber} (selezionato)`, class: 'bg-blue-500 hover:bg-blue-600' };
        return { title: `Posto ${seatNumber}`, class: 'bg-green-500 hover:bg-green-600 cursor-pointer' };
    };

    return (
        <div className="bg-gray-700 rounded-lg p-8">
            <h3 className="text-xl font-bold text-gray-200 mb-4">Seleziona i tuoi posti</h3>
            
            <div className="flex justify-center gap-6 mb-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
                    <span className="text-gray-300">Disponibile</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                    <span className="text-gray-300">Selezionato</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                    <span className="text-gray-300">Occupato</span>
                </div>
            </div>

            <div className="mb-8">
                <div className="bg-gray-300 h-2 rounded-full mx-auto max-w-64 mb-2"></div>
                <p className="text-center text-gray-400 text-sm">SCHERMO</p>
            </div>

            <div className="flex flex-col items-center">
                {showtime.seats.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-2 my-1">
                        <span className="w-8 text-center text-gray-400 text-sm self-center">
                            {rowIndex + 1}
                        </span>
                        {row.map((seatStatus, colIndex) => {
                            const seatInfo = getSeatInfo(rowIndex, colIndex);
                            return (
                                <button
                                    key={`${rowIndex}-${colIndex}`}
                                    onClick={() => handleSeatClick(rowIndex, colIndex)}
                                    className={`w-8 h-8 rounded-md transition-colors ${seatInfo.class}`}
                                    title={seatInfo.title}
                                    disabled={seatStatus === 1 || isLoading}
                                >
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-600 text-white rounded-md text-center">
                    {error}
                </div>
            )}

            <div className="flex justify-center mt-6">
                <button
                    onClick={handleBooking}
                    disabled={selectedSeats.length === 0 || isLoading}
                    className={`font-bold py-3 px-6 rounded-full transition-colors ${
                        selectedSeats.length === 0 || isLoading
                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="32" strokeDashoffset="32">
                                    <animate attributeName="stroke-dashoffset" dur="1s" values="32;0;32" repeatCount="indefinite"/>
                                </circle>
                            </svg>
                            Prenotando...
                        </span>
                    ) : (
                        `Prenota (${selectedSeats.length} posti)`
                    )}
                </button>
            </div>
        </div>
    );
};

export default SeatSelection;