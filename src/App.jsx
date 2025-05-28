import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import f1 from './assets/f1.jpg';
import Footer from './footer.jsx'
import { useNavigate } from 'react-router-dom';


// Import components
import Authentication from './Authentication';
import Booking from './Booking';
import CheckInOut from './CheckInOut';

// Navbar Component
const Navbar = ({ user, toggleMusic, isMusicPlaying }) => {
  const [tapCount, setTapCount] = useState(0);
  const tapTimer = useRef(null);
  const navigate = useNavigate();

  const handleLogoTap = () => {
    setTapCount(prevCount => prevCount + 1);
    
    // Clear any existing timer
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
    }
    
    // Set a new timer to reset tap count after 500ms
    tapTimer.current = setTimeout(() => {
      
      // If double tap detected
      if (tapCount === 1) {
        // Navigate to CheckInOut page
        navigate('/CheckInOut');
      }
      setTapCount(0);
    }, 500);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 py-3 bg-black/50 backdrop-blur-sm border-b border-fuchsia-500/30">
      <div className="flex items-center">
        <Link 
          to="/" 
          className="font-['Orbitron'] text-white text-lg font-bold mr-6"
          onClick={handleLogoTap}
        >
          SANSKRUTHI
        </Link>
      </div>
      
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Music Control Button */}
        {/* <button
          onClick={toggleMusic}
          className="text-white p-2 rounded-full hover:bg-fuchsia-900/30 transition-all duration-300"
          aria-label={isMusicPlaying ? "Pause music" : "Play music"}
        >
          {isMusicPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
        </button> */}
        
        {/* Fashion Show Button - Improved UI */}
        <Link 
          to="/fashion-show"
          className="font-['Orbitron'] py-1.5 px-3 text-xs md:text-sm text-white border border-fuchsia-500 rounded-md font-medium transition-all duration-300 hover:bg-fuchsia-900/30 flex items-center gap-1"
          style={{
            boxShadow: '0 0 3px #c417e0',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fuchsia-300">
            <path d="M12 1v4"></path>
            <path d="M5 8l2 2"></path>
            <path d="M17 8l-2 2"></path>
            <path d="M12 16l-3-2"></path>
            <path d="M12 16l3-2"></path>
            <path d="M12 16v4"></path>
            <path d="M8 12a4 4 0 0 1 8 0"></path>
          </svg>
          FASHION WALK
        </Link>
        
        {/* Conditional Book Ticket or Login Button */}
        <Link 
          to={user ? "/booking" : "/auth"}
          className="font-['Orbitron'] py-1.5 px-3 text-xs md:text-sm bg-fuchsia-600/80 text-white rounded-md font-medium transition-all duration-300 hover:bg-fuchsia-500"
        >
          {user ? "Login Here" : "LOGIN"}
        </Link>
      </div>
    </nav>
  );
};

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
    }, 500);

    // Create audio element programmatically
    const audio = new Audio('/music/background-music.mp3');
    audio.loop = true;
    audio.volume = 0.4;
    audio.preload = 'auto';
    audioRef.current = audio;

    // Clean up function
    return () => {
      unsubscribe();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle user interaction - Simplified and improved for better browser compatibility
  useEffect(() => {
    const handleUserInteraction = () => {
      if (audioRef.current && !isMusicPlaying) {
        try {
          // Store the play promise
          const playPromise = audioRef.current.play();
          
          // Modern browsers return a promise from play()
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsMusicPlaying(true);
                console.log("Music started successfully");
              })
              .catch(error => {
                console.error("Audio play failed:", error);
                // Keep trying on autoplay failures
                setTimeout(() => {
                  if (!isMusicPlaying && audioRef.current) {
                    audioRef.current.play().catch(e => console.error("Retry failed:", e));
                  }
                }, 1000);
              });
          }
        } catch (error) {
          console.error("Error playing audio:", error);
        }
      }
    };

    // Add event listeners for user interaction
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      // Remove event listeners
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [isMusicPlaying]);

  // Toggle music function - Improved to handle play/pause better
  const toggleMusic = () => {
    if (!audioRef.current) return;
    
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsMusicPlaying(true);
          })
          .catch(error => {
            console.error("Play failed:", error);
            // Force unmute in case browser has muted it
            audioRef.current.muted = false;
            audioRef.current.volume = 0.4;
          });
      }
    }
  };

  return (
    <div className="h-full w-full relative overflow-hidden  ">
      {/* Navbar */}
      <Navbar user={user} toggleMusic={toggleMusic} isMusicPlaying={isMusicPlaying} />
      
      {/* Animated background with the boombox GIF */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <div className="absolute inset-0 bg-black opacity-0 z-20"></div>
        <img 
          src="/200w.gif" 
          alt="DJ Boombox" 
            className="absolute inset-0 min-w-screen min-h-dvh sm:w-full sm:h-full z-20 md:z-30 opacity-95 hue-rotate-[280deg] brightness-0 md:brightness-50"
          
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-20 "></div>
      </div>
      
      {/* Animated grid overlay */}
      <div className="absolute inset-0 z-30 opacity-35" 
        style={{
          backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 0, 255, 0.3) 25%, rgba(255, 0, 255, 0.3) 26%, transparent 27%, transparent 74%, rgba(255, 0, 255, 0.3) 75%, rgba(255, 0, 255, 0.3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 0, 255, 0.3) 25%, rgba(255, 0, 255, 0.3) 26%, transparent 27%, transparent 74%, rgba(255, 0, 255, 0.3) 75%, rgba(255, 0, 255, 0.3) 76%, transparent 77%, transparent)',
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }}
      ></div>

      {/* Content container - Added pt-20 to allow space for the navbar */}
      <div className={`relative z-40 w-[90%] max-w-5xl mx-auto flex flex-col mb-15 items-center pt-10 ${
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } transition-all duration-1000 ease-in-out`}>
        
        {/* College info with neon effect */}
        <div className="text-center mb-25 md:mb-8">
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
        
        {/* Event title with intense neon effect - Reduced vertical margins */}
        <div className="my-6 md:my-10 relative">
          {/* Animated glow circle behind title */}
          <div className="absolute  top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[140%] rounded-full bg-purple-900/20 blur-xl"
               style={{ animation: 'pulse 3s infinite' }}></div>
               
          <h1 className="font-['Orbitron'] text-4xl sm:text-6xl md:text-7xl font-black tracking-wider text-white mb-4"
              style={{
                textShadow: '0 0 7px #ff00ff, 0 0 10px #ff00ff, 0 0 21px #ff00ff, 0 0 42px #c417e0, 0 0 82px #c417e0, 0 0 92px #c417e0',
                animation: 'flickerText 3s infinite alternate'
              }}>
            SANSKRUTHI
          </h1>
          
          <div className="font-['Orbitron'] text-2xl sm:text-3xl md:text-4xl text-center font-bold text-white mt-2"
               style={{
                 textShadow: '0 0 5px #17b2e0, 0 0 10px #17b2e0, 0 0 15px #17b2e0',
                 animation: 'flickerSmall 2s infinite alternate' 
               }}>
            2K25
          </div>
          
        </div>
        
        {/* DJ deck animated equalizer - Reduced height */}
        <div className="w-full max-w-md flex items-end justify-center gap-1 mb-8 h-12">
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

        <div className=" font-['Orbitron'] text-sm md:text-lg text-center text-white">Organized by Student Welfare Office</div>
        
        {/* CTA button with hover effects */}
        <div className="mt-4 md:mt-6 flex flex-col items-center">
          <Link 
            to={user ? "/booking" : "/auth"}
            className="font-['Orbitron'] py-3 px-8 text-md md:text-xl bg-transparent text-white border-2 border-fuchsia-500 rounded-full font-semibold tracking-wider transition-all duration-500"
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
            Free Register Now
          </Link>
          
          <p className="text-fuchsia-300 text-sm mt-4 font-light" style={{ textShadow: '0 0 5px #c417e0' }}>
            Free Register now to secure your spot!
          </p>
          
          {/* Social media with animated icons */}
          <div className='mb-0 md:mb-0'></div>
          
        </div>
      </div>

      

      {/* Animated particles */}
      <div className="particle-container absolute inset-0 z-30">
        {[...Array(200)].map((_, i) => (
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

// SecureRoute Component for protected routes
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

// Layout component to wrap pages with the Navbar
const Layout = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Create audio element programmatically for layout pages
    const audio = new Audio('/music/background-music.mp3');
    audio.loop = true;
    audio.volume = 0.4;
    audio.preload = 'auto';
    audioRef.current = audio;

    return () => {
      unsubscribe();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Fixed toggle music function
  const toggleMusic = () => {
    if (!audioRef.current) return;
    
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsMusicPlaying(true);
          })
          .catch(error => {
            console.error("Play failed:", error);
            // Force unmute in case browser has muted it
            audioRef.current.muted = false;
            audioRef.current.volume = 0.4;
          });
      }
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white">
      <Navbar user={user} toggleMusic={toggleMusic} isMusicPlaying={isMusicPlaying} />
      <div className="pt-16">
        {children}
        
      </div>
      <Footer />
    </div>
    
  );
};

// Fashion Show Component
const FashionShow = () => {
  return (
    <div className="container mx-auto px-4 py-10">
       
      <div className="max-w-4xl mx-auto">
        {/* Fashion Show Poster */}
        <div className="relative rounded-lg overflow-hidden border-2 border-fuchsia-500 mb-8"
             style={{ boxShadow: '0 0 15px #c417e0' }}>
         <img 
  src={f1} 
  alt="Fashion Show Poster" 
  className="w-full h-auto"
/>

          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="font-['Orbitron'] text-center text-3xl md:text-4xl font-bold text-white mb-2"
                style={{ textShadow: '0 0 10px #c417e0, 0 0 20px #c417e0' }}>
              SANSKRUTHI FASHION WALK
            </h2>
            <p className="text-white/90 text-lg text-center">Showcase your style on the biggest stage!</p>
          </div>
        </div>
        
        {/* Registration Info */}
        <div className="bg-black/50 text-center backdrop-blur-sm border border-fuchsia-500/30 rounded-lg p-6 mb-8">
          <h3 className="font-['Orbitron'] text-2xl text-white mb-4"
              style={{ textShadow: '0 0 5px #c417e0' }}>
            REGISTRATION
          </h3>
          <p className="text-white/90 mb-6">
            Join us for an unforgettable night of fashion and creativity. Show off your unique style and compete for amazing prizes!
          </p>
          
          {/* Registration and Rules Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href="https://forms.gle/LRxVzDZrMDFMCszy9" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-['Orbitron'] inline-block py-3 px-6 bg-fuchsia-600/80 text-white rounded-md font-medium transition-all duration-300 hover:bg-fuchsia-500"
            >
              REGISTER NOW
            </a>
            
            <a 
              href="https://drive.google.com/file/d/1OhKOMv6Z8QDjGs9zWklEB4ZHWRaM2ifW/view?usp=sharing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-['Orbitron'] inline-flex items-center gap-2 py-3 px-6 bg-transparent text-white border-2 border-fuchsia-500 rounded-md font-medium transition-all duration-300 hover:bg-fuchsia-500/20"
              style={{ boxShadow: '0 0 5px #c417e0' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
              VIEW RULES
            </a>
          </div>
        </div>
        
        {/* Event Details */}
        <div className="bg-black/50 text-center backdrop-blur-sm border border-fuchsia-500/30 rounded-lg p-6">
          <h3 className="font-['Orbitron'] text-2xl text-white mb-4"
              style={{ textShadow: '0 0 5px #c417e0' }}>
            EVENT DETAILS
          </h3>
          <div className="">
            <div>
              <h4 className="text-fuchsia-300 text-center text-lg mb-2">Date & Time</h4>
              <p className="text-white">June 4, 2025, 3 PM</p>
            </div>
            
      
          </div>
        </div>
      </div>
      <div className="particle-container w-full overflow-hidden absolute inset-0 z-30">
        {[...Array(200)].map((_, i) => (
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
function App() {

  


  return (
    <Router>
      <Routes>
        <Route path="/" element={
         
  
          <Layout>
             <Home />
          </Layout>
        
          
      
      } />
        <Route path="/auth" element={
          <Layout>
            <Authentication />
          </Layout>
        } />
        <Route path="/CheckInOut" element={
          <Layout>
            <CheckInOut />
          </Layout>
        } />
        <Route path="/fashion-show" element={
          <Layout>
            <FashionShow />
          </Layout>
        } />
        <Route path="/booking" element={
          <SecureRoute>
            <Layout>
              <Booking />
            </Layout>
          </SecureRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* <Footer/> */}
    </Router>
    

  );
}

export default App;