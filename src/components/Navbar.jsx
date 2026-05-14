import { useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
const Navbar = () => {
    const navigate = useNavigate();
    return (
        <div className='w-full font-semibold'>
            <div className=''>
                <div className='flex items-center gap-3'> 
                    <button onClick={() =>navigate(-1)} className='h-10 w-10 rounded-full bg-black flex items-center justify-center cursor-pointer'>
                        <img  className='w-5' src={assets.arrow_left} alt='Back' />
                    </button>
                    <button onClick={() =>navigate(+1)} className='h-10 w-10 rounded-full bg-black flex items-center justify-center cursor-pointer'>
                        <img  className='w-5' src={assets.arrow_right} alt='Forward' />
                    </button>
                </div>

                <div className='flex items-center gap-4'> 
                    <button className='bg-white text-black text-[16px] px-6 py-2 rounded-full hidden md:block cursor-pointer'>
                        Explore Premium
                    </button>
                    <button className='bg-black text-white text-[16px] px-5 py-2 rounded-full cursor-pointer'>
                        Install App
                    </button>
                    <button className='bg-purple-500 text-black h-10 w-10 rounded-full flex items-center justify-center font-bold cursor-pointer'>
                        A.T
                    </button>
                </div>
            </div>

            <div className='flex items-center gap-3 mt-5'>
                <button className='bg-white text-black px-5 py-2 rounded-full cursor-pointer'>
                    All
                </button>
                <button className='bg-black text-white px-5 py-2 rounded-full cursor-pointer'>
                    Music
                </button>
                <button className='bg-black text-white px-5 py-2 rounded-full cursor-pointer'>
                    Podcasts
                </button>
            </div>
        </div>
    )
}

export default Navbar;
