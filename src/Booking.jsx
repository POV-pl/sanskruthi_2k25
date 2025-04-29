// Booking.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase'; // Make sure path is correct

const Booking = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [ticketInfo, setTicketInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    ticketType: 'general',
    quantity: 1
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Pre-fill email field
        setTicketInfo(prev => ({
          ...prev,
          email: currentUser.email || '',
          fullName: currentUser.displayName || ''
        }));
      } else {
        // User is not signed in, redirect to auth page
        navigate('/auth');
      }
    });

    // Animated loading effect
    setTimeout(() => {
      setIsLoaded(true);
    }, 500);

    return () => unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTicketInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Add ticket booking to Firestore
      const ticketDocRef = await addDoc(collection(db, "tickets"), {
        ...ticketInfo,
        userId: user.uid,
        createdAt: serverTimestamp(),
        status: 'pending' // You can change this based on your payment flow
      });

      console.log("Ticket booked with ID:", ticketDocRef.id);
      setBookingSuccess(true);
      
      // Reset form after 3 seconds or redirect to a confirmation page
      setTimeout(() => {
        setBookingSuccess(false);
        // navigate(`/confirmation/${ticketDocRef.id}`); // Uncomment if you have a confirmation page
      }, 3000);
    } catch (error) {
      console.error("Error booking ticket:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate ticket prices
  const ticketPrices = {
    general: 299,
    vip: 599,
    premium: 899
  };

  const totalAmount = ticketPrices[ticketInfo.ticketType] * ticketInfo.quantity;

  return (
    <div className="min-h-screen w-screen relative overflow-x-hidden flex justify-center">
      {/* Animated background with the boombox GIF */}
      <div className="fixed inset-0 z-0 flex items-center justify-center">
        <div className="absolute inset-0 bg-black opacity-40 z-10"></div>
        <img 
          src="/200w.gif" 
          alt="DJ Boombox" 
          className="absolute inset-0 min-w-screen min-h-dvh sm:w-full sm:h-full object-cover z-0 opacity-100"
          style={{ filter: 'hue-rotate(280deg) brightness(0.7)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-20"></div>
      </div>
      
      {/* Animated grid overlay */}
      <div className="fixed inset-0 z-30 opacity-20" 
        style={{
          backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 0, 255, 0.3) 25%, rgba(255, 0, 255, 0.3) 26%, transparent 27%, transparent 74%, rgba(255, 0, 255, 0.3) 75%, rgba(255, 0, 255, 0.3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 0, 255, 0.3) 25%, rgba(255, 0, 255, 0.3) 26%, transparent 27%, transparent 74%, rgba(255, 0, 255, 0.3) 75%, rgba(255, 0, 255, 0.3) 76%, transparent 77%, transparent)',
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }}
      ></div>

      {/* Content container */}
      <div className={`relative z-40 w-[90%] max-w-5xl mx-auto py-8 md:py-16 flex flex-col items-center ${
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } transition-all duration-1000 ease-in-out`}>
        
        {/* Header with user info */}
        <div className="w-full flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="font-['Orbitron'] text-3xl sm:text-4xl md:text-5xl font-bold tracking-wider text-white"
                style={{
                  textShadow: '0 0 7px #ff00ff, 0 0 10px #ff00ff, 0 0 21px #ff00ff',
                }}>
              SANSKRUTHI 2K25
            </h1>
            <p className="text-fuchsia-300 mt-2">Book your tickets now!</p>
          </div>
          
          {user && (
            <div className="mt-4 md:mt-0 flex items-center gap-4">
              <div className="flex items-center">
                {user.photoURL && (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full border-2 border-fuchsia-500"
                    style={{ boxShadow: '0 0 10px rgba(196, 23, 224, 0.5)' }}
                  />
                )}
                <div className="ml-2">
                  <p className="text-white text-sm">{user.displayName}</p>
                  <p className="text-fuchsia-300 text-xs">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={handleSignOut}
                className="text-fuchsia-300 hover:text-white text-sm border border-fuchsia-500 rounded-full px-3 py-1 transition-all duration-300 hover:bg-fuchsia-900/30"
                style={{ textShadow: '0 0 5px rgba(196, 23, 224, 0.5)' }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
        
        {/* Booking form */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 md:p-8 w-full border border-fuchsia-500/30"
             style={{ boxShadow: '0 0 15px rgba(196, 23, 224, 0.3)' }}>
          
          {bookingSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-fuchsia-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-['Orbitron'] text-2xl font-bold text-white mb-2"
                  style={{ textShadow: '0 0 5px #c417e0, 0 0 10px #c417e0' }}>
                Booking Successful!
              </h3>
              <p className="text-fuchsia-200">Your ticket has been reserved. Check your email for details.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 className="font-['Orbitron'] text-2xl font-bold text-white mb-6"
                  style={{ textShadow: '0 0 5px #c417e0, 0 0 10px #c417e0' }}>
                BOOK YOUR TICKETS
              </h2>
              
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-fuchsia-200 mb-1">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={ticketInfo.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-black/30 border border-fuchsia-500/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
                
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-fuchsia-200 mb-1">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={ticketInfo.email}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-black/30 border border-fuchsia-500/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
                
                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-fuchsia-200 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={ticketInfo.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-black/30 border border-fuchsia-500/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
                
                {/* Ticket Type */}
                <div>
                  <label htmlFor="ticketType" className="block text-fuchsia-200 mb-1">Ticket Type</label>
                  <select
                    id="ticketType"
                    name="ticketType"
                    value={ticketInfo.ticketType}
                    onChange={handleInputChange}
                    className="w-full bg-black/30 border border-fuchsia-500/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  >
                    <option value="general">General (₹299)</option>
                    <option value="vip">VIP (₹599)</option>
                    <option value="premium">Premium (₹899)</option>
                  </select>
                </div>
                
                {/* Quantity */}
                <div>
                  <label htmlFor="quantity" className="block text-fuchsia-200 mb-1">Quantity</label>
                  <select
                    id="quantity"
                    name="quantity"
                    value={ticketInfo.quantity}
                    onChange={handleInputChange}
                    className="w-full bg-black/30 border border-fuchsia-500/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                
                {/* Total Amount */}
                <div className="mt-6 p-4 border border-fuchsia-500/20 rounded-lg bg-fuchsia-900/10">
                  <div className="flex justify-between items-center">
                    <span className="text-fuchsia-200">Total Amount:</span>
                    <span className="font-['Orbitron'] text-xl font-bold text-white"
                          style={{ textShadow: '0 0 5px #c417e0' }}>
                      ₹{totalAmount}
                    </span>
                  </div>
                </div>
                
                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-6 font-['Orbitron'] py-3 px-6 bg-transparent text-white border-2 border-fuchsia-500 rounded-full font-semibold tracking-wider transition-all duration-500 hover:bg-fuchsia-500/20 flex items-center justify-center"
                  style={{
                    boxShadow: '0 0 5px #c417e0, 0 0 10px #c417e0',
                    animation: 'borderPulse 1.5s infinite alternate'
                  }}
                >
                  {isSubmitting ? (
                    <div className="inline-block animate-spin w-5 h-5 border-2 border-fuchsia-500 border-t-transparent rounded-full mr-2"></div>
                  ) : null}
                  {isSubmitting ? 'PROCESSING...' : 'BOOK NOW'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {/* Animated particles */}
      <div className="particle-container fixed inset-0 z-30 pointer-events-none">
        {[...Array(30)].map((_, i) => (
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

export default Booking;