import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full mt-auto py-4 px-4 bg-black/60 backdrop-blur-md border-t border-fuchsia-500/30">
      <div className="max-w-6xl mx-auto">
        {/* Main footer content */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
          {/* Logo/branding section */}
          <div className="flex flex-col items-center md:items-start">
            <Link to="/" className="font-['Orbitron'] text-lg font-bold text-white mb-1 tracking-wider"
                  style={{ textShadow: '0 0 3px #c417e0' }}>
              SANSKRUTHI
            </Link>
            <p className="text-xs text-white/70">DR. AMBEDKAR INSTITUTE OF TECHNOLOGY</p>
          </div>
          
          {/* Quick links - center on mobile, right on desktop */}
          <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2">
            <Link to="/" className="text-white/90 text-sm hover:text-fuchsia-400 transition-colors duration-300">
              Home
            </Link>
            <Link to="/fashion-show" className="text-white/90 text-sm hover:text-fuchsia-400 transition-colors duration-300">
              Fashion Show
            </Link>
            <Link to="/booking" className="text-white/90 text-sm hover:text-fuchsia-400 transition-colors duration-300">
              Book Tickets
            </Link>
            <a href="#" className="text-white/90 text-sm hover:text-fuchsia-400 transition-colors duration-300">
              Contact
            </a>
          </div>
        </div>
        
        {/* Social media and copyright */}
        <div className="flex flex-col-reverse md:flex-row items-center justify-between pt-3 border-t border-fuchsia-500/20">
          {/* Copyright info */}
          <div className="text-xs text-white/60 mt-3 md:mt-0 text-center md:text-left">
            © {currentYear} <span className="font-medium text-white/80">Sanskruthi DRAIT</span>. All rights reserved.
          </div>
          
          {/* Social icons with hover effects */}
          <div className="flex items-center justify-center gap-4">
            <a href="https://www.instagram.com/sanskruthi_drait" 
               target="_blank" 
               rel="noopener noreferrer"
               className="text-white/80 hover:text-fuchsia-400 transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a href="#" 
               className="text-white/80 hover:text-fuchsia-400 transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
            <a href="mailto:contact@sanskruthi.edu" 
               className="text-white/80 hover:text-fuchsia-400 transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;