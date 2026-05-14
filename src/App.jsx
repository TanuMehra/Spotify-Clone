import Sidebar from './components/Sidebar';
import Player from './components/Player';
import Display from './components/Display';
import { useContext } from 'react';
import {PlayerContext} from './context/playerContext';

const App = ()=>{

const {audioRef,track} = useContext(PlayerContext);

  return (
    <div className='h-screen bg-black'>
<div className='h-[90%] flex'>
  <Sidebar />
  <Display />
</div>
<Player/>
<audio preload='auto' ref={audioRef} src = {track.file}></audio>
    </div>
  )
}

export default App;
