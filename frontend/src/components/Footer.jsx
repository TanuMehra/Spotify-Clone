import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-transparent text-[#a7a7a7] py-10 px-4 md:px-8 mt-12 border-t border-[#292929]/40 select-none animate-fadeIn">
      {/* Upper Section */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-10">
        
        {/* Column 1: Company */}
        <div className="flex flex-col gap-3">
          <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-1">Company</h4>
          <Link to="#" className="hover:text-[#1db954] text-xs font-semibold hover:underline transition-all">About</Link>
          <Link to="#" className="hover:text-[#1db954] text-xs font-semibold hover:underline transition-all">Jobs</Link>
          <Link to="#" className="hover:text-[#1db954] text-xs font-semibold hover:underline transition-all">For the Record</Link>
        </div>

        {/* Column 2: Communities */}
        <div className="flex flex-col gap-3">
          <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-1">Communities</h4>
          <Link to="#" className="hover:text-[#1db954] text-xs font-semibold hover:underline transition-all">For Artists</Link>
          <Link to="#" className="hover:text-[#1db954] text-xs font-semibold hover:underline transition-all">Developers</Link>
          <Link to="#" className="hover:text-[#1db954] text-xs font-semibold hover:underline transition-all">Advertising</Link>
          <Link to="#" className="hover:text-[#1db954] text-xs font-semibold hover:underline transition-all">Investors</Link>
          <Link to="#" className="hover:text-[#1db954] text-xs font-semibold hover:underline transition-all">Vendors</Link>
        </div>

        {/* Column 3: Useful Links */}
        <div className="flex flex-col gap-3">
          <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-1">Useful Links</h4>
          <Link to="#" className="hover:text-[#1db954] text-xs font-semibold hover:underline transition-all">Support</Link>
          <Link to="#" className="hover:text-[#1db954] text-xs font-semibold hover:underline transition-all">Free Mobile App</Link>
        </div>

        {/* Column 4: Social Media Buttons */}
        <div className="flex flex-col gap-4 col-span-2 md:col-span-1 lg:col-span-2 md:items-start lg:items-end">
          <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-1 md:self-start lg:self-auto">Social Media</h4>
          <div className="flex gap-3">
            <a href="#" className="w-10 h-10 rounded-full bg-[#292929] hover:bg-[#1db954] hover:text-black text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg">
              <span className="text-sm">📸</span>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-[#292929] hover:bg-[#1db954] hover:text-black text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg">
              <span className="text-sm">🐦</span>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-[#292929] hover:bg-[#1db954] hover:text-black text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg">
              <span className="text-sm">👥</span>
            </a>
          </div>
        </div>
      </div>

      <hr className="border-[#292929]/50 max-w-7xl mx-auto mb-6" />

      {/* Bottom Section */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider text-center sm:text-left justify-center sm:justify-start">
          <Link to="#" className="hover:underline hover:text-white transition-colors">Legal</Link>
          <Link to="#" className="hover:underline hover:text-white transition-colors">Privacy Center</Link>
          <Link to="#" className="hover:underline hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="#" className="hover:underline hover:text-white transition-colors">Cookies</Link>
          <Link to="#" className="hover:underline hover:text-white transition-colors">About Ads</Link>
        </div>

        <div className="text-xs font-semibold text-center sm:text-right flex flex-col gap-1 select-none">
          <p className="text-[#a7a7a7] hover:text-white transition-colors">
            © {currentYear} Spotify Clone. All rights reserved.
          </p>
          <p className="text-[#a7a7a7] flex items-center justify-center sm:justify-end gap-1">
            Developed with <span className="text-[#1db954] animate-pulse">💚</span> by{' '}
            <span className="text-white hover:text-[#1db954] hover:underline font-extrabold cursor-pointer transition-colors">
              Tanu Mehra
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
