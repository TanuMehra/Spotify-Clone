import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import Display from './components/Display';
import Login from './components/Login';
import Signup from './components/Signup';
import VerifyOtp from './components/VerifyOtp';
import Footer from './components/Footer';
import { PlayerContext } from './context/playerContext';

const App = () => {
  const { audioRef, track, user, loadingAuth, toast } = useContext(PlayerContext);

  if (loadingAuth) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white select-none">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1db954] mb-4"></div>
        <p className="text-[#a7a7a7] text-xs font-bold uppercase tracking-wider animate-pulse">Initializing Spotify Session...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white select-none overflow-hidden relative">
      {!user ? (
        <div className="h-screen flex flex-col justify-between overflow-y-auto bg-black scrollbar-thin">
          <div className="flex-grow flex items-center justify-center py-10">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify" element={<VerifyOtp />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
          <Footer />
        </div>
      ) : (
        <div className="h-screen flex flex-col justify-between">
          <div className="h-[90%] flex">
            <Sidebar />
            <Display />
          </div>
          <Player />
          <audio preload="auto" ref={audioRef} src={track.file}></audio>
        </div>
      )}

      {/* FLOATING TOAST SYSTEM */}
      {toast && (
        <div className="absolute bottom-24 right-6 z-50 animate-slideIn">
          <div className={`px-5 py-3 rounded-full text-xs font-black shadow-2xl flex items-center gap-2 border ${
            toast.type === 'success' ? 'bg-[#1db954] text-black border-[#1db954]' :
            toast.type === 'error' ? 'bg-[#e91429] text-white border-[#e91429]' :
            'bg-[#282828] text-white border-[#3e3e3e]'
          }`}>
            <span>{
              toast.type === 'success' ? '✅' :
              toast.type === 'error' ? '⚠️' : '🔔'
            }</span>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
