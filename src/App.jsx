// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useState, useEffect,useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
``
// Import components
import Authentication from './Authentication'; 
import Booking from './Booking';

const Home = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false); // Track music state
  const audioRef = useRef(null); // Reference to audio element

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsCheckingAuth(false);
    });

    setTimeout(() => {
      setIsLoaded(true);
      
      // Attempt to play music immediately when component loads
      if (audioRef.current) {
        audioRef.current.volume = 0.4; // Set volume to 40%
        
        // Load the audio first (which is allowed without interaction)
        audioRef.current.load();
        
        // Try to play - this may be blocked by browser until user interacts
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Autoplay started successfully");
              setIsMusicPlaying(true);
            })
            .catch(error => {
              console.log("Autoplay prevented by browser:", error);
              // Will try again on user interaction
            });
        }
      }
    }, 500);

    // This function tries to play the music
    const playMusic = () => {
      if (audioRef.current && !isMusicPlaying) {
        audioRef.current.volume = 0.4; // Set volume to 40%
        audioRef.current.play()
          .then(() => {
            setIsMusicPlaying(true);
            console.log("Music started after user interaction");
          })
          .catch(error => {
            console.log("Audio play failed:", error);
          });
      }
    };

    // Handle user interaction to play music (browser requirement)
    const handleUserInteraction = (e) => {
      playMusic();
      
      // Remove event listeners after successful play
      if (isMusicPlaying) {
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
      }
    };

    // Add multiple event listeners for different types of interactions
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      unsubscribe();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      
      // Ensure music stops when component unmounts
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isMusicPlaying]);

  // Toggle music function
  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden flex justify-center items-center">
      {/* Background Audio Player - Added autoplay and muted attributes to help with autoplay policies */}
      <audio 
        ref={audioRef}
        src="/music/background-music.mp3" // Replace with your music file path
        loop
        autoPlay
        preload="auto"
      />
      
      {/* Music Control Button - Positioned at top-right corner with enhanced visibility */}
   

      {/* Animated background with the boombox GIF */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <div className="absolute inset-0 bg-black opacity-40 z-10"></div>
        <img 
          src="/200w.gif" 
          alt="DJ Boombox" 
          className="absolute inset-0 min-w-screen min-h-dvh sm:w-full sm:h-full object-cover z-0 opacity-80"
          style={{ filter: 'hue-rotate(280deg) brightness(0.7)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-20"></div>
      </div>
      
      {/* Rest of your existing code */}
      {/* Animated grid overlay */}
      <div className="absolute inset-0 z-30 opacity-25" 
        style={{
          backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 0, 255, 0.3) 25%, rgba(255, 0, 255, 0.3) 26%, transparent 27%, transparent 74%, rgba(255, 0, 255, 0.3) 75%, rgba(255, 0, 255, 0.3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 0, 255, 0.3) 25%, rgba(255, 0, 255, 0.3) 26%, transparent 27%, transparent 74%, rgba(255, 0, 255, 0.3) 75%, rgba(255, 0, 255, 0.3) 76%, transparent 77%, transparent)',
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }}
      ></div>

      {/* Content container */}
      <div className={`relative z-40 w-[90%] max-w-5xl mx-auto flex flex-col items-center ${
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } transition-all duration-1000 ease-in-out`}>
        
        {/* College info with neon effect */}
        <div className="text-center mb-25 md:mb-10">
          <h2 className="font-['Orbitron'] text-lg md:text-2xl lg:text-3xl font-bold text-white tracking-wider px-4 py-2"
              style={{
                textShadow: '0 0 5px #c417e0, 0 0 10px #c417e0, 0 0 20px #c417e0',
                animation: 'pulsate 2.5s infinite alternate'
              }}>
            DR. AMBEDKAR INSTITUTE OF TECHNOLOGY
          </h2>
          <p className="text-xs md:text-lg font-light mt-2 text-white/90">
            Panchajanya Vidya Peetha Welfare Trust (R)
          </p>
          <p className="text-xs md:text-base text-white/70 mt-1">
            Bengaluru, Karnataka
          </p>
        </div>
        
        {/* Event title with intense neon effect */}
        <div className="my-8 md:my-16 relative">
          {/* Animated glow circle behind title */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[140%] rounded-full bg-purple-900/20 blur-xl"
               style={{ animation: 'pulse 3s infinite' }}></div>
               
          <h1 className="font-['Orbitron'] text-4xl sm:text-6xl md:text-8xl font-black tracking-wider text-white mb-4"
              style={{
                textShadow: '0 0 7px #ff00ff, 0 0 10px #ff00ff, 0 0 21px #ff00ff, 0 0 42px #c417e0, 0 0 82px #c417e0, 0 0 92px #c417e0',
                animation: 'flickerText 3s infinite alternate'
              }}>
            SANSKRUTHI
          </h1>
          
          <div className="font-['Orbitron'] text-2xl sm:text-3xl md:text-5xl text-center font-bold text-white mt-2"
               style={{
                 textShadow: '0 0 5px #17b2e0, 0 0 10px #17b2e0, 0 0 15px #17b2e0',
                 animation: 'flickerSmall 2s infinite alternate' 
               }}>
            2K25
          </div>
        </div>
        
        {/* DJ deck animated equalizer */}
        <div className="w-full max-w-md flex items-end justify-center gap-1 mb-10 h-16">
          {[...Array(32)].map((_, i) => (
            <div 
              key={i} 
              className="w-2 md:w-3 rounded-t-md bg-gradient-to-t from-purple-600 to-fuchsia-400"
              style={{
                height: `${Math.floor(Math.random() * 100) + 20}%`,
                animation: `equalizer ${(Math.random() * 0.8 + 0.5).toFixed(2)}s ease-in-out infinite alternate`,
                animationDelay: `${(i * 0.03).toFixed(2)}s`,
                boxShadow: '0 0 5px #ff00ff, 0 0 10px #ff00ff'
              }}
            ></div>
          ))}
        </div>
        
        {/* CTA button with hover effects */}
        <div className="mt-4 md:mt-6 flex flex-col items-center">
          <Link 
            to={user ? "/booking" : "/auth"}
            className="font-['Orbitron'] py-4 px-10 text-md md:text-xl bg-transparent text-white border-2 border-fuchsia-500 rounded-full font-semibold tracking-wider transition-all duration-500"
            style={{
              boxShadow: '0 0 5px #c417e0, 0 0 10px #c417e0',
              animation: 'borderPulse 1.5s infinite alternate'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(196, 23, 224, 0.3)';
              e.currentTarget.style.boxShadow = '0 0 10px #c417e0, 0 0 20px #c417e0, 0 0 30px #c417e0';
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.boxShadow = '0 0 5px #c417e0, 0 0 10px #c417e0';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            GET YOUR TICKET
          </Link>
          
          <p className="text-fuchsia-300 text-sm mt-4 font-light" style={{ textShadow: '0 0 5px #c417e0' }}>
            Limited tickets available - Book yours now!
          </p>
          
          {/* Social media with animated icons */}
          <div className="flex items-center gap-6 mt-8">
            <a href="#" className="text-white hover:text-fuchsia-400 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <span className="text-base tracking-wider text-white/90 font-['Orbitron']">@sanskruthi_drait</span>
          </div>
        </div>
      </div>

      {/* Animated particles */}
      <div className="particle-container absolute inset-0 z-30">
        {[...Array(40)].map((_, i) => (
          <div 
            key={i}
            className="particle absolute rounded-full bg-fuchsia-500"
            style={{
              width: `${Math.random() * 5 + 1}px`,
              height: `${Math.random() * 5 + 1}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.2,
              animation: `float ${Math.random() * 10 + 10}s linear infinite`,
              boxShadow: '0 0 5px #ff00ff'
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

// Optional: Add a secure route component to protect routes
const SecureRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsChecking(false);
    });

    return () => unsubscribe();
  }, []);

  if (isChecking) {
    return <div className="h-screen w-screen flex items-center justify-center bg-black">
      <div className="text-fuchsia-500 text-xl">Loading...</div>
    </div>;
  }

  return isAuthenticated ? children : <Navigate to="/auth" />;
};

function App() {
  useEffect(() => {
    // Add the CSS animations to the document head
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulsate {
        0% { text-shadow: 0 0 4px #c417e0, 0 0 8px #c417e0, 0 0 18px #c417e0; }
        100% { text-shadow: 0 0 7px #c417e0, 0 0 13px #c417e0, 0 0 25px #c417e0; }
      }
      
      @keyframes flickerText {
        0%, 18%, 22%, 25%, 53%, 57%, 100% {
          text-shadow: 0 0 7px #ff00ff, 0 0 10px #ff00ff, 0 0 21px #ff00ff, 0 0 42px #c417e0, 0 0 82px #c417e0;
        }
        20%, 24%, 55% {
          text-shadow: none;
        }
      }
      
      @keyframes flickerSmall {
        0%, 50%, 100% {
          text-shadow: 0 0 5px #17b2e0, 0 0 10px #17b2e0, 0 0 15px #17b2e0;
        }
        25%, 75% {
          text-shadow: 0 0 3px #17b2e0, 0 0 6px #17b2e0, 0 0 9px #17b2e0;
        }
      }
      
      @keyframes equalizer {
        0% { height: 10%; }
        100% { height: 100%; }
      }
      
      @keyframes pulse {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.3; }
        50% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
        100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.3; }
      }
      
      @keyframes float {
        0% { transform: translateY(0) translateX(0); }
        50% { transform: translateY(-20px) translateX(10px); }
        100% { transform: translateY(0) translateX(0); }
      }
      
      @keyframes borderPulse {
        0% { box-shadow: 0 0 5px #c417e0, 0 0 10px #c417e0; }
        100% { box-shadow: 0 0 7px #c417e0, 0 0 15px #c417e0, 0 0 20px #c417e0; }
      }
      
      @keyframes gridMove {
        0% { background-position: 0 0; }
        100% { background-position: 50px 50px; }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Authentication />} />
        <Route path="/booking" element={
          <SecureRoute>
            <Booking />
          </SecureRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;