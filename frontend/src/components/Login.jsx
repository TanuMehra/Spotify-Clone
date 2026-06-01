import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PlayerContext } from '../context/playerContext';
import { assets } from '../assets/assets';

const Login = () => {
  const navigate = useNavigate();
  const { sendOTP } = useContext(PlayerContext);

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanInput = emailOrPhone.trim();
    if (!cleanInput) {
      setError('Please enter a valid phone number or email address.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      console.log('Initiating login OTP for:', cleanInput);
      await sendOTP(cleanInput, 'login');
      if (rememberDevice) {
        localStorage.setItem('spotify_remember_device', 'true');
      }
      // Redirect directly to the dedicated OTP verification page with query params
      navigate(`/verify?emailOrPhone=${encodeURIComponent(cleanInput)}&flow=login`);
    } catch (err) {
      console.error('Login sending OTP failed:', err);
      setError(err.response?.data?.message || 'Login failed. Account might not exist. Please sign up first.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center px-4 py-12 select-none animate-fadeIn">
      {/* Spotify Header Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <img className="w-40 filter invert" src={assets.spotify_logo} alt="Spotify Logo" />
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-4 text-center">
          Log in to Spotify
        </h1>
      </div>

      <div className="w-full max-w-md bg-[#121212] p-8 md:p-10 rounded-2xl shadow-2xl border border-[#292929] transition-all">
        {error && (
          <div className="mb-5 bg-[#e91429] text-white p-3.5 rounded-lg text-sm font-semibold flex items-center gap-2 animate-pulse">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-white mb-2" htmlFor="emailOrPhone">
              Email Address
            </label>
            <input
              id="emailOrPhone"
              type="email"
              placeholder="Enter your email address"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#727272] hover:border-white focus:border-[#1db954] text-white rounded-md py-3 px-4 outline-none transition-colors text-sm"
              required
            />
            <p className="text-[#a7a7a7] text-[10px] mt-2 leading-relaxed">
              We will send a 6-digit one-time password (OTP) to your email to verify your active account profile.
            </p>
          </div>

          <div className="flex items-center gap-2 select-none">
            <input
              id="remember"
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="w-4 h-4 accent-[#1db954] cursor-pointer rounded"
            />
            <label htmlFor="remember" className="text-xs font-semibold text-[#a7a7a7] cursor-pointer">
              Remember this device
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1db954] hover:bg-[#1ed760] disabled:bg-[#1db954]/50 text-black font-extrabold py-3.5 rounded-full transition-all active:scale-95 shadow-lg shadow-[#1db954]/10 text-base cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
            ) : (
              'Continue'
            )}
          </button>
        </form>

        <hr className="my-8 border-[#292929]" />

        <div className="text-center">
          <p className="text-[#a7a7a7] text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-white hover:text-[#1db954] font-bold underline transition-colors">
              Sign up for Spotify
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
