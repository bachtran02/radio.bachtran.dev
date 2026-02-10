import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

import { Controls } from '../Controls/Controls';
import { LiveAudioStream } from '../LiveAudioStream';
import { NowPlaying } from '../NowPlaying/NowPlaying';
import { Queue } from '../Queue/Queue';
import { Search } from '../Search/Search';

import './AudioPlayer.css';

export function AudioPlayer() {

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? saved === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        localStorage.setItem('darkMode', isDarkMode.toString());
        
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [isDarkMode]);

    return (
        <div className={`audio-player ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
            <button 
                className="theme-toggle" 
                onClick={() => setIsDarkMode(!isDarkMode)}
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
