// App.jsx
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
import moonBg from './assets/purple-moon.gif';

const Home = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsLoaded(true);
    }, 500);
  }, []);

  return (
    <div className="landing-container">
      <div className="bg-overlay"></div>
      <video autoPlay muted loop className="bg-video">
        <source src="https://cdnjs.cloudflare.com/ajax/libs/Blotter/0.1.0/assets/videos/ink.mp4" type="video/mp4" />
      </video>
      
      <div className={`content-wrapper ${isLoaded ? 'loaded' : ''}`}>
        <div className="institute-name">
          <h2 className="glow-text">DR. AMBEDKAR INSTITUTE OF TECHNOLOGY</h2>
          <p className="subtitle">Panchajanya Vidya Peetha Welfare Trust (R)</p>
          <p className="location">Bengaluru, Karnataka</p>
        </div>
        
        <div className="event-logo">
          <div className="neon-circle"></div>
          <h1 className="event-title">SANSKRUTHI</h1>
          <div className="event-year">2K25</div>
        </div>
        
        <div className="actions">
          <Link to="/tickets" className="neon-button">TICKETS COMING SOON</Link>
          <div className="social-links">
            <a href="#" className="social-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <span className="instagram-handle">@sanskruthi_drait</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Tickets = () => {
  return (
    <div className="tickets-container">
      <h1 className="glow-text">Tickets Coming Soon</h1>
      <p>Stay tuned for exclusive early bird offers!</p>
      <Link to="/" className="neon-button">Back to Home</Link>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tickets" element={<Tickets />} />
      </Routes>
    </Router>
  );
}

export default App;