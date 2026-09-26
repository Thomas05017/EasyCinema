import React from 'react';
import { Link } from 'react-router-dom';

const PaymentCancelPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700/50 max-w-md text-center">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">Pagamento annullato</h3>
            <p className="text-slate-400 mb-6">
                Nessun addebito è stato effettuato. I posti selezionati sono stati rilasciati.
            </p>
            <Link
                to="/"
                className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200"
            >
                Torna ai film
            </Link>
        </div>
    </div>
);

export default PaymentCancelPage;