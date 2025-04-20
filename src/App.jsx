// App.jsx
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';



const Home = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsLoaded(true);
    }, 500);
  }, []);

  return (
    <div className="h-screen   w-screen relative overflow-hidden flex justify-center items-center">
      <div className="absolute top-0 left-0 w-full h-full bg-[rgba(4,2,79,0.7)] z-[1]"></div>
      
      <video autoPlay muted loop className="absolute top-0 left-0 w-full h-full object-cover opacity-30 mix-blend-screen z-[2]">
        <source src="/Untitled video - Made with Clipchamp.mp4" type="video/mp4" />
      </video>
      
      <div className={`relative z-[10] w-[90%] max-w-[1200px] flex flex-col items-center justify-between h-[80vh] ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'} transition-all duration-1000 ease-in-out`}>
        <div className="text-center mb-5">
          <h2 className="font-['Orbitron'] font-bold text-white shadow-[0_0_5px_#c417e0,0_0_10px_#c417e0,0_0_20px_#c417e0] tracking-wider rounded-xl px-1 ">DR. AMBEDKAR INSTITUTE OF TECHNOLOGY</h2>
          <p className="text-base font-light mt-1 text-white/80">Panchajanya Vidya Peetha Welfare Trust (R)</p>
          <p className="text-sm text-white/70">Bengaluru, Karnataka</p>
        </div>
        
        <div className="flex flex-col items-center justify-center relative my-10">
          <div className="w-[280px] h-[280px] rounded-full border-2 border-white/80 shadow-[0_0_10px_#c417e0,0_0_20px_#c417e0,inset_0_0_10px_#c417e0] absolute z-[-1] animate-pulse"></div>
          <h1 className="font-['Orbitron'] text-4xl md:text-[4.5rem] font-black tracking-wider text-white shadow-[0_0_5px_#c417e0,0_0_10px_#c417e0,0_0_20px_#c417e0,0_0_30px_#c417e0] mb-2 rounded-xl px-1">SANSKRUTHI</h1>
          <div className="font-['Orbitron'] text-2xl md:text-[2.5rem] font-bold text-white shadow-[0_0_5px_#17b2e0,0_0_10px_#17b2e0] rounded-xl px-1">2K25</div>
        </div>
        
        <div className="flex flex-col items-center gap-5 mt-10">
          <Link to="/tickets" className="font-['Orbitron'] py-3 px-6 bg-transparent text-white border border-white/80 rounded-full font-semibold tracking-wider transition-all duration-300 ease-in-out shadow-[0_0_5px_#c417e0,0_0_10px_#c417e0] hover:bg-[rgba(196,23,224,0.2)] hover:shadow-[0_0_10px_#c417e0,0_0_20px_#c417e0,0_0_30px_#c417e0] hover:-translate-y-0.5">
            GET YOUR TICKET
          </Link>
          <div className="flex items-center gap-2 mt-2">
            <a href="#" className="text-white hover:text-[#c417e0] transition-all duration-300 hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <span className="text-sm tracking-wider">@sanskruthi_drait</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/tickets" element={<Tickets />} /> */}
        {/* <Route path="/verify/:ticketId" element={<VerifyTicket />} /> */}
      </Routes>
    </Router>
  );
}

export default App;