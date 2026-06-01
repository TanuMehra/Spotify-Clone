import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlayerContext } from '../context/playerContext';
import { assets } from '../assets/assets';

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sendOTP, verifyOTP, showToast } = useContext(PlayerContext);

  // Extract query parameters
  const query = new URLSearchParams(location.search);
  const emailOrPhone = query.get('emailOrPhone') || '';
  const flow = query.get('flow') || 'login';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const otpInputRef = useRef(null);

  // Expiration & resend timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Autofocus the code input on mount
  useEffect(() => {
    if (otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, []);

  // Auto-submit OTP when it hits 6 digits
  useEffect(() => {
    if (otp.trim().length === 6) {
      handleVerify();
    }
  }, [otp]);

  // Submit OTP Verification
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (otp.trim().length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      console.log('Verifying verification OTP...', otp.trim());
      await verifyOTP(emailOrPhone, otp.trim());
      showToast('OTP verified successfully! Welcome to Spotify.', 'success');
      navigate('/');
    } catch (err) {
      console.error('OTP verification failed:', err);
      setError(err.response?.data?.message || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Action
  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      setError('');
      setLoading(true);
      setOtp('');
      console.log('Resending OTP code via flow:', flow);
      await sendOTP(emailOrPhone, flow);
      setCountdown(30); // reset countdown
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification code.');
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
          Enter Verification Code
        </h1>
      </div>

      <div className="w-full max-w-md bg-[#121212] p-8 md:p-10 rounded-2xl shadow-2xl border border-[#292929] transition-all">
        {/* Customized Flow Message Alert */}
        <div className="mb-6 p-4 rounded-xl text-center border font-bold text-xs select-none uppercase tracking-wider bg-white/5 border-white/10 text-[#1db954]">
          OTP sent to your email
        </div>

        {error && (
          <div className="mb-5 bg-[#e91429] text-white p-3.5 rounded-lg text-sm font-semibold flex items-center gap-2 animate-pulse">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-white" htmlFor="otp">
                Enter 6-Digit OTP Code
              </label>
              <button
                type="button"
                onClick={() => navigate(flow === 'signup' ? '/signup' : '/login')}
                className="text-xs text-[#1db954] hover:underline font-bold"
              >
                Change email
              </button>
            </div>
            <input
              id="otp"
              ref={otpInputRef}
              type="text"
              maxLength={6}
              placeholder="0 0 0 0 0 0"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // numbers only
              className="w-full bg-[#1e1e1e] border border-[#727272] hover:border-white focus:border-[#1db954] text-white rounded-md py-3 px-4 outline-none tracking-[8px] text-center font-black transition-colors text-base"
              required
            />
            <p className="text-[#a7a7a7] text-xs mt-3 text-center">
              OTP code sent to <span className="text-white font-bold">{emailOrPhone}</span>
            </p>
          </div>

          {/* Countdown & Resends */}
          <div className="text-center text-xs font-semibold">
            {countdown > 0 ? (
              <p className="text-[#a7a7a7]">
                Resend code in <span className="text-[#1db954] font-black">{countdown}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-[#1db954] hover:underline font-extrabold cursor-pointer"
              >
                📩 Resend verification OTP code
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1db954] hover:bg-[#1ed760] disabled:bg-[#1db954]/50 text-black font-extrabold py-3.5 rounded-full transition-all active:scale-95 shadow-lg shadow-[#1db954]/10 text-base cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
            ) : (
              'Verify OTP'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
