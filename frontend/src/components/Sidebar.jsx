import { useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <div className="w-[25%] h-full p-2 flex flex-col gap-2 text-white hidden lg:flex" >
        <div className=" bg-[#121212] py-6 rounded flex flex-col gap-5 justify-around ">
            <div onClick={() => navigate('/')} className="flex items-center gap-4 pl-8 cursor-pointer hover:text-[#1DB954] transition-all duration-300 text-gray-400 hover:text-white">
                <img className="w-6 hover:scale-105 transition-transform" src={assets.home_icon} alt="Home" />
                <p className="font-bold">Home</p>
            </div>
            <div className="flex items-center gap-4 pl-8 cursor-pointer hover:text-[#1DB954] transition-all duration-300 text-gray-400 hover:text-white">
                <img className="w-6 hover:scale-105 transition-transform" src={assets.search_icon} alt="Search" />
                <p className="font-bold">Search</p>
            </div>
            <div onClick={() => navigate('/profile')} className="flex items-center gap-4 pl-8 cursor-pointer hover:text-[#1DB954] transition-all duration-300 text-gray-400 hover:text-white">
                <svg className="w-6 h-6 hover:scale-105 transition-all duration-300" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <p className="font-bold">Profile</p>
            </div>
        </div>

        <div className="bg-[#121212] flex-grow rounded flex flex-col gap-4">
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img className="w-8" src={assets.stack_icon} alt="Stack" />
                    <p className="font-semibold text-gray-400">Your Library</p>
                </div>
                <div className="flex items-center gap-3">
                    <img className="w-5 cursor-pointer opacity-70 hover:opacity-100 transition-opacity" src={assets.arrow_icon} alt="arrow" />
                    <img className="w-5 cursor-pointer opacity-70 hover:opacity-100 transition-opacity" src={assets.plus_icon} alt="plus" />
                </div>
            </div>
            <div className="p-4 bg-[#242424] rounded font-semibold flex flex-col items-start justify-start gap-1 pl-4 mx-2" >
                <h1>Create your first playlist</h1>
                <p className="font-light text-xs text-gray-400">It's easy, we will help you</p>
                <button className="px-4 py-1.5 bg-white text-[13px] text-black rounded-full mt-4 hover:scale-105 active:scale-95 transition-all font-bold">Create playlist</button>
            </div>
            
            <div className="p-4 bg-[#242424] rounded font-semibold flex flex-col items-start justify-start gap-1 pl-4 mx-2" >
                <h1>Let's find some podcasts to follow</h1>
                <p className="font-light text-xs text-gray-400">We'll keep you updated on new episodes</p>
                <button className="px-4 py-1.5 bg-white text-[13px] text-black rounded-full mt-4 hover:scale-105 active:scale-95 transition-all font-bold">Browse podcasts</button>
            </div>
        </div>
    </div>
  );
};

export default Sidebar;
