import React, { useContext } from 'react'
import Sidebar from './components/Sidebar/Sidebar'
import Main from './components/Main/Main'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './Auth';
import { Context } from './context/Context';

const App = () => {
  const { user, isAuthInitialized } = useContext(Context);

  // ✅ SHOW LOADING SCREEN WHILE AUTH INITIALIZES
  if (!isAuthInitialized) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* AUTH ROUTE */}
        <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />

        {/* MAIN APP - Requires login */}
        <Route path="/" element={
          user ? (
            <div className="flex animate-fadeIn w-full h-screen bg-slate-50 dark:bg-slate-950">
              <Sidebar />
              <Main />
            </div>
          ) : (
            <Navigate to="/auth" />
          )
        } />

        {/* Handle 404s */}
        <Route path="*" element={user ? <Navigate to="/" /> : <Navigate to="/auth" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
