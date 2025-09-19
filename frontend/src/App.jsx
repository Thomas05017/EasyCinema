import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MovieDetailPage from './pages/MovieDetailPage';
import LoginPage from './pages/LoginPage';
import './index.css';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/movies/:id" element={<ProtectedRoute> <MovieDetailPage /> </ProtectedRoute>} />
      <Route path="/login" element={<LoginPage />}/>
    </Routes>
  );
}

export default App;