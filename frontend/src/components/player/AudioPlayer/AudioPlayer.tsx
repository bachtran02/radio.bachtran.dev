import { Sun, Moon } from 'lucide-react';

import { Controls } from '@/components/player/Controls/Controls';
import { LiveAudioStream } from '@/components/player/LiveAudioStream';
import { NowPlaying } from '@/components/player/NowPlaying/NowPlaying';
import { Queue } from '@/components/player/Queue/Queue';
import { Search } from '@/components/player/Search/Search';
import { useDarkMode } from '@/hooks/useDarkMode';

import './AudioPlayer.css';

export function AudioPlayer() {

    const { isDarkMode, toggleDarkMode } = useDarkMode();

    return (
        <div className={`audio-player ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
            <button 
                className="theme-toggle" 
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
            >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="main-content">
                <div className="center-section">
                    <NowPlaying />
                    <Controls />
                </div>

                <div className="right-section">
                    <Search />
                    <Queue />
                </div>
            </div>
            <LiveAudioStream />
        </div>
    );
}
