// Authentication.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from './firebase'; // Make sure path is correct

const Authentication = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is already signed in, redirect to booking page
        navigate('/booking');
      }
    });

    // Animated loading effect
    setTimeout(() => {
      setIsLoaded(true);
    }, 500);

    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // The user will be automatically redirected due to onAuthStateChanged
    } catch (error) {
      console.error("Authentication error:", error);
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden flex justify-center items-center">
      {/* Animated background with the boombox GIF */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <div className="absolute inset-0 bg-black opacity-40 z-10"></div>
        {/* <img 
          src="" 
          alt="" 
          className="absolute inset-0 min-w-screen min-h-dvh sm:w-full sm:h-full object-cover z-0 opacity-100"
          style={{ filter: 'hue-rotate(280deg) brightness(0.7)' }}
        /> */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black z-30"></div>
      </div>
      
      {/* Animated grid overlay */}
      <div className="absolute inset-0 z-30 opacity-20" 
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
        
        {/* Authentication section */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-8 w-full max-w-md border border-fuchsia-500/30"
             style={{ boxShadow: '0 0 15px rgba(196, 23, 224, 0.3)' }}>
          <h2 className="font-['Orbitron'] text-2xl text-center font-bold text-white mb-6"
              style={{ textShadow: '0 0 5px #c417e0, 0 0 10px #c417e0' }}>
            AUTHENTICATION
          </h2>
          
          <p className="text-fuchsia-200 text-center mb-8">
            Sign in to proceed with your ticket booking
          </p>
          
          <button 
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="w-full font-['Orbitron'] py-4 px-6 flex items-center justify-center gap-3 text-md bg-transparent text-white border-2 border-fuchsia-500 rounded-full font-semibold tracking-wider transition-all duration-500 hover:bg-fuchsia-500/20"
            style={{
              boxShadow: '0 0 5px #c417e0, 0 0 10px #c417e0',
              animation: 'borderPulse 1.5s infinite alternate'
            }}
          >
            {isAuthenticating ? (
              <div className="inline-block animate-spin w-5 h-5 border-2 border-fuchsia-500 border-t-transparent rounded-full"></div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>
        
        {/* Animated particles */}
        <div className="particle-container absolute inset-0 z-30 pointer-events-none">
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
    </div>
  );
};

export default Authentication;