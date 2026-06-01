import { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { assets } from '../assets/assets';
import { PlayerContext } from '../context/playerContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, loadingAuth } = useContext(PlayerContext);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isAdminView = location.pathname.includes('/admin');

  // Helper to extract initials from full name
  const getInitials = (name) => {
    if (!name || name === 'Spotify Listener') return 'SU';
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="w-full font-semibold relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-full bg-black flex items-center justify-center cursor-pointer hover:bg-black/80 transition-colors"
          >
            <img className="w-5" src={assets.arrow_left} alt="Back" />
          </button>
          <button
            onClick={() => navigate(+1)}
            className="h-10 w-10 rounded-full bg-black flex items-center justify-center cursor-pointer hover:bg-black/80 transition-colors"
          >
            <img className="w-5" src={assets.arrow_right} alt="Forward" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Admin panel redirect toggle */}
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate(isAdminView ? '/' : '/admin')}
              className="bg-[#1db954] hover:bg-[#1ed760] text-black text-xs font-black px-5 py-2 rounded-full cursor-pointer transition-transform active:scale-95 shadow shadow-[#1db954]/10"
            >
              {isAdminView ? '🏡 Back to Player' : '⚙️ Admin Dashboard'}
            </button>
          )}

          <button className="bg-white text-black text-[14px] font-black px-5 py-2 rounded-full hidden md:block cursor-pointer hover:scale-105 transition-transform">
            Explore Premium
          </button>
          
          <button className="bg-black text-white text-[14px] font-black px-5 py-2 rounded-full border border-[#292929] cursor-pointer hover:border-white transition-colors">
            Install App
          </button>

          {/* Dynamic Profile Button with dropdown */}
          <div className="relative">
            {loadingAuth ? (
              <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#1DB954]"></div>
              </div>
            ) : (
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="bg-purple-600 hover:bg-purple-500 text-white h-10 w-10 rounded-full flex items-center justify-center font-black text-xs cursor-pointer transition-all border border-black hover:border-white select-none overflow-hidden"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  getInitials(user?.fullName || 'Spotify User')
                )}
              </button>
            )}

            {showProfileMenu && !loadingAuth && (
              <div className="absolute right-0 mt-3 w-52 bg-[#181818] border border-[#282828] rounded shadow-2xl z-50 p-2.5 py-2.5 animate-fadeIn flex flex-col gap-1.5">
                <div className="px-3 py-2 border-b border-[#282828] mb-1 flex flex-col gap-0.5">
                  <p className="text-white text-xs font-black truncate">{user?.fullName || 'Spotify User'}</p>
                  <p className="text-[#a7a7a7] text-[10px] truncate">{user?.email || 'user@example.com'}</p>
                  {user?.username ? (
                    <p className="text-[#1DB954] text-[9px] font-bold truncate mt-0.5">@{user.username}</p>
                  ) : (
                    <p className="text-gray-500 text-[9px] font-bold truncate mt-0.5">@user</p>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full text-left text-xs font-bold text-red-500 hover:bg-red-500/10 hover:text-red-400 p-2 px-3 rounded transition-colors cursor-pointer"
                >
                  🚪 Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!isAdminView && (
        <div className="flex items-center gap-3 mt-5">
          <button className="bg-white text-black px-5 py-2 rounded-full cursor-pointer hover:scale-105 transition-transform text-xs font-black">
            All
          </button>
          <button className="bg-black text-white px-5 py-2 rounded-full border border-[#292929] cursor-pointer hover:border-white transition-colors text-xs font-black">
            Music
          </button>
          <button className="bg-black text-white px-5 py-2 rounded-full border border-[#292929] cursor-pointer hover:border-white transition-colors text-xs font-black">
            Podcasts
          </button>
        </div>
      )}
    </div>
  );
};

export default Navbar;
