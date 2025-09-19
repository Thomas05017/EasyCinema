import React, { useState } from 'react';

const SeatSelection = ({ showtime }) => {
    const [selectedSeats, setSelectedSeats] = useState([]);

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

    const handleBooking = () => {
        if (selectedSeats.length > 0) {
            alert(`Prenotazione effettuata con successo!.`);
            // funzione per inviare i dati a un server
            // setSelectedSeats([]);
        } else {
            alert('Seleziona almeno un posto!');
        }
    };

    return (
        <div className="bg-gray-700 rounded-lg p-8">
            <h3 className="text-xl font-bold text-gray-200 mb-4">Seleziona i tuoi posti</h3>
            <div className="flex flex-col items-center">
                {showtime.seats.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-2 my-1">
                        {row.map((seatStatus, colIndex) => (
                            <button
                                key={`${rowIndex}-${colIndex}`}
                                onClick={() => handleSeatClick(rowIndex, colIndex)}
                                className={`w-8 h-8 rounded-md
                                    ${seatStatus === 1 ? 'bg-red-500 cursor-not-allowed' : ''}
                                    ${selectedSeats.includes(`${rowIndex}-${colIndex}`) ? 'bg-blue-500' : ''}
                                    ${seatStatus === 0 && !selectedSeats.includes(`${rowIndex}-${colIndex}`) ? 'bg-green-500 hover:bg-green-600' : ''}
                                `}
                                title={seatStatus === 1 ? 'Posto occupato' : `Posto ${rowIndex + 1}-${colIndex + 1}`}
                                disabled={seatStatus === 1}
                            >
                            </button>
                        ))}
                    </div>
                ))}
            </div>
            <div className="flex justify-center mt-6">
                <button
                    onClick={handleBooking}
                    className="bg-blue-600 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-700 transition-colors"
                >
                Prenota ({selectedSeats.length} posti)
                </button>
            </div>
        </div>
    );
};

export default SeatSelection;