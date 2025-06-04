import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase'; // Make sure path is correct

const Booking = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [verifiedDetails, setVerifiedDetails] = useState(false);
  const fileInputRef = useRef(null);
  const ticketRef = useRef(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    usn: '',
    collegeName: '',
    referralSource: '',
    imageUrl: ''
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Pre-fill email field
        setFormData(prev => ({
          ...prev,
          email: currentUser.email || '',
          fullName: currentUser.displayName || ''
        }));
        
        // Check if user is already registered
        await checkExistingRegistration(currentUser.uid);
      } else {
        // User is not signed in, redirect to auth page
        navigate('/');
      }
    });

    // Animated loading effect
    setTimeout(() => {
      setIsLoaded(true);
    }, 500);

    return () => unsubscribe();
  }, [navigate]);

  const checkExistingRegistration = async (userId) => {
    try {
      const registrationsRef = collection(db, "registrations");
      const q = query(registrationsRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // User has already registered
        const existingData = querySnapshot.docs[0].data();
        setRegistrationData(existingData);
        setAlreadyRegistered(true);
      }
    } catch (error) {
      console.error("Error checking registration:", error);
    }
  };

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
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVerificationChange = (e) => {
    setVerifiedDetails(e.target.checked);
  };

 const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert("Please select a valid image file (JPG or PNG)");
    return;
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    alert("Image size should be less than 10MB");
    return;
  }

  setImageUploading(true);
  
  const formDataObj = new FormData();
  formDataObj.append('file', file);
  formDataObj.append('upload_preset', 'sanskruthi2k25');
  
  // Remove API key parameter (not needed for unsigned uploads)

  try {
    console.log('Starting image upload...');
    
    const cloudinaryUrl = 'https://api.cloudinary.com/v1_1/dbasmuwa7/upload';
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formDataObj,
      // Cloudinary supports CORS, no need for custom headers
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      // Try to get detailed error from Cloudinary
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    const data = await response.json();
    console.log('Cloudinary response:', data);
    
    if (data.secure_url) {
      setFormData(prev => ({
        ...prev,
        imageUrl: data.secure_url
      }));
      alert("Image uploaded successfully!");
    } else {
      throw new Error('Invalid response from Cloudinary');
    }
  } catch (error) {
    console.error("Image upload error:", error);
    alert(`Failed to upload image: ${error.message}. Please try again.`);
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  } finally {
    setImageUploading(false);
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.imageUrl) {
      alert("Please upload your image first");
      setIsSubmitting(false);
      return;
    }

    if (!verifiedDetails) {
      alert("Please verify your details by checking the confirmation box");
      setIsSubmitting(false);
      return;
    }

    try {
      // Add registration to Firestore
      const registrationDocRef = await addDoc(collection(db, "registrations"), {
        ...formData,
        userId: user.uid,
        createdAt: serverTimestamp(),
        eventDate: "June 4, 2025",
        venue: "Dr. Ambedkar Institute of Technology"
      });

      console.log("Registration successful with ID:", registrationDocRef.id);
      
      // Fetch the complete registration data to display
      const registrationSnapshot = await getDocs(query(
        collection(db, "registrations"), 
        where("userId", "==", user.uid)
      ));
      
      if (!registrationSnapshot.empty) {
        setRegistrationData(registrationSnapshot.docs[0].data());
      }
      
      setRegistrationSuccess(true);
      setAlreadyRegistered(true);
    } catch (error) {
      console.error("Error registering:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Generate proper QR code using a simple encoding method
  const generateQRCode = (data) => {
    const qrData = data || user?.uid || "INVALID";
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
    
    return (
      <div className="flex flex-col items-center">
        <img 
          src={qrImageUrl} 
          alt="QR Code" 
          className="w-48 h-48 border-4 border-white"
        />
        <p className="text-gray-700 mt-2 text-xs">Your UID: {qrData.substring(0, 8)}...</p>
      </div>
    );
  };

  // Download ticket as image
  const downloadTicket = () => {
    if (!ticketRef.current) return;
    
    // Use html2canvas to convert the div to an image
    import('html2canvas').then(html2canvas => {
      html2canvas.default(ticketRef.current).then(canvas => {
        const imageData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imageData;
        link.download = `sanskruthi-ticket-${user?.uid?.substring(0, 8) || 'ticket'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }).catch(err => {
      console.error("Error loading html2canvas:", err);
      alert("Could not download ticket. Please try again.");
    });
  };

  // Print ticket
  const printTicket = () => {
    window.print();
  };

  const renderRegistrationForm = () => (
    <form onSubmit={handleSubmit}>
      <h2 className="font-['Orbitron'] text-2xl font-bold text-white mb-6"
          style={{ textShadow: '0 0 5px #c417e0, 0 0 10px #c417e0' }}>
        REGISTER FOR SANSKRUTHI 2K25
      </h2>
      
      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-fuchsia-200 mb-1">Full Name</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
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
            value={formData.email}
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
            value={formData.phone}
            onChange={handleInputChange}
            required
            className="w-full bg-black/30 border border-fuchsia-500/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          />
        </div>

        {/* USN */}
        <div>
          <label htmlFor="usn" className="block text-fuchsia-200 mb-1">USN</label>
          <input
            type="text"
            id="usn"
            name="usn"
            value={formData.usn}
            onChange={handleInputChange}
            required
            className="w-full bg-black/30 border border-fuchsia-500/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          />
        </div>

        {/* College Name */}
        <div>
          <label htmlFor="collegeName" className="block text-fuchsia-200 mb-1">College Name</label>
          <input
            type="text"
            id="collegeName"
            name="collegeName"
            value={formData.collegeName}
            onChange={handleInputChange}
            required
            className="w-full bg-black/30 border border-fuchsia-500/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          />
        </div>

        {/* How Did You Hear About Us */}
        <div>
          <label htmlFor="referralSource" className="block text-fuchsia-200 mb-1">How did you hear about us?</label>
          <select
            id="referralSource"
            name="referralSource"
            value={formData.referralSource}
            onChange={handleInputChange}
            required
            className="w-full bg-black/30 border border-fuchsia-500/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          >
            <option value="">Select an option</option>
            <option value="social_media">Social Media</option>
            <option value="friend">Friend</option>
            <option value="college">College Notice</option>
            <option value="website">Website</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-fuchsia-200 mb-1">Your Photo</label>
          <p className="text-fuchsia-300 text-xs mb-2">Please upload a clear, front-facing photo for identification</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <div className="mt-2 flex flex-col items-center justify-center">
            {formData.imageUrl ? (
              <div className="relative">
                <img 
                  src={formData.imageUrl} 
                  alt="Upload preview" 
                  className="h-40 w-40 object-cover rounded-lg border-2 border-fuchsia-500" 
                />
                <button
                  type="button"
                  onClick={triggerFileInput}
                  disabled={imageUploading}
                  className="absolute bottom-2 right-2 bg-fuchsia-700 text-white p-1 rounded-full hover:bg-fuchsia-600 disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                  ✓ Uploaded
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={triggerFileInput}
                className="h-40 w-40 border-2 border-dashed border-fuchsia-500 rounded-lg flex flex-col items-center justify-center text-fuchsia-300 hover:bg-fuchsia-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={imageUploading}
              >
                {imageUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin h-8 w-8 border-2 border-fuchsia-500 border-t-transparent rounded-full mb-2"></div>
                    <span className="text-sm">Uploading...</span>
                    <span className="text-xs text-fuchsia-400 mt-1">Please wait</span>
                  </div>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Upload Clear Photo</span>
                    <span className="text-xs text-fuchsia-400 mt-1">Click to select</span>
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Upload Progress/Status */}
          {imageUploading && (
            <div className="mt-2 text-center">
              <div className="text-fuchsia-300 text-sm">Uploading to cloud storage...</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-fuchsia-500 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
              </div>
            </div>
          )}
          
          {formData.imageUrl && !imageUploading && (
            <div className="mt-2 text-center">
              <div className="text-green-400 text-sm flex items-center justify-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Image uploaded successfully!
              </div>
            </div>
          )}
        </div>
        
        {/* Event Info */}
        <div className="mt-6 p-4 border border-fuchsia-500/20 rounded-lg bg-fuchsia-900/10">
          <div className="text-center">
            <span className="font-['Orbitron'] text-lg font-bold text-fuchsia-200"
                  style={{ textShadow: '0 0 3px #c417e0' }}>
              FREE ENTRY
            </span>
            <div className="mt-2 text-sm text-fuchsia-300">
              <p>Event Date: June 4, 2025</p>
              <p>Venue: Dr. Ambedkar Institute of Technology</p>
            </div>
          </div>
        </div>

        {/* Verification Checkbox */}
        <div className="mt-4">
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={verifiedDetails}
              onChange={handleVerificationChange}
              required
              className="mt-1 form-checkbox h-4 w-4 text-fuchsia-600 transition duration-150 ease-in-out"
            />
            <span className="ml-2 text-fuchsia-200 text-sm">
              I verify that all the information provided is correct and accurate. I understand that providing false information may result in the cancellation of my registration.
            </span>
          </label>
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !formData.imageUrl || !verifiedDetails}
          className={`w-full mt-6 font-['Orbitron'] py-3 px-6 bg-transparent text-white border-2 ${(!formData.imageUrl || !verifiedDetails) ? 'border-gray-500 opacity-50' : 'border-fuchsia-500'} rounded-full font-semibold tracking-wider transition-all duration-500 hover:bg-fuchsia-500/20 flex items-center justify-center`}
          style={formData.imageUrl && verifiedDetails ? {
            boxShadow: '0 0 5px #c417e0, 0 0 10px #c417e0',
            animation: 'borderPulse 1.5s infinite alternate'
          } : {}}
        >
          {isSubmitting ? (
            <div className="inline-block animate-spin w-5 h-5 border-2 border-fuchsia-500 border-t-transparent rounded-full mr-2"></div>
          ) : null}
          {isSubmitting ? 'PROCESSING...' : 'REGISTER NOW'}
        </button>
      </div>
    </form>
  );

  const renderSuccessView = () => (
    <div className="flex flex-col items-center py-6">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-fuchsia-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-['Orbitron'] text-2xl font-bold text-white mb-2"
            style={{ textShadow: '0 0 5px #c417e0, 0 0 10px #c417e0' }}>
          Registration Successful!
        </h3>
        <p className="text-fuchsia-200 mb-4">You are registered for Sanskruthi 2K25.</p>
      </div>

      {/* Ticket with QR Code - Use ref for downloading */}
      <div id="printable-ticket" ref={ticketRef} className="bg-gradient-to-br from-black to-fuchsia-900 p-6 rounded-lg mb-6 w-full max-w-md">
        <div className="text-center border-b-2 border-fuchsia-500 pb-4 mb-4">
          <h3 className="font-['Orbitron'] text-xl font-bold text-white"
              style={{ textShadow: '0 0 5px #c417e0, 0 0 10px #c417e0' }}>
            SANSKRUTHI 2K25
          </h3>
          <p className="text-fuchsia-200 text-sm">June 4, 2025 | Dr. Ambedkar Institute of Technology</p>
        </div>

        {/* QR Code */}
        <div className="bg-white p-4 rounded-lg mb-4 mx-auto max-w-xs">
          {generateQRCode(user?.uid)}
        </div>
        
        {/* Registration Details */}
        <div className="w-full bg-black/50 border border-fuchsia-500/30 rounded-lg p-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex">
              <img 
                src={registrationData?.imageUrl} 
                alt="User" 
                className="h-20 w-20 object-cover rounded-lg border border-fuchsia-500" 
              />
              <div className="ml-4">
                <p className="text-white font-semibold">{registrationData?.fullName}</p>
                <p className="text-fuchsia-300 text-sm">{registrationData?.collegeName}</p>
                <p className="text-fuchsia-300 text-sm">USN: {registrationData?.usn}</p>
              </div>
            </div>
            
            <div className="space-y-1 text-sm">
              <p className="text-white flex justify-between">
                <span>Email:</span> 
                <span className="text-fuchsia-300">{registrationData?.email}</span>
              </p>
              <p className="text-white flex justify-between">
                <span>Phone:</span> 
                <span className="text-fuchsia-300">{registrationData?.phone}</span>
              </p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-fuchsia-500/30 text-center">
            <p className="text-fuchsia-200 text-sm">Please show this QR code at the entry gate</p>
          </div>
        </div>
      </div>

      <button 
        onClick={downloadTicket}
        className="flex-1 py-3 px-4 bg-fuchsia-900 hover:bg-fuchsia-950 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Download Ticket
      </button>
    </div>
  );

  return (
    <div className="min-h-screen w-screen relative overflow-x-hidden flex justify-center">
      {/* Custom CSS Styles */}
      <style jsx>{`
        @keyframes borderPulse {
          0% { box-shadow: 0 0 5px #c417e0, 0 0 10px #c417e0; }
          100% { box-shadow: 0 0 10px #c417e0, 0 0 20px #c417e0, 0 0 30px #c417e0; }
        }
        
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        
        .particle {
          filter: blur(1px);
        }
        
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-ticket, #printable-ticket * {
            visibility: visible;
          }
          #printable-ticket {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>

      {/* Animated background with the boombox GIF */}
      <div className="fixed inset-0 z-0 flex items-center justify-center">
        <div className="absolute inset-0 bg-black opacity-40 z-10"></div>
        <img 
          src="/200w.gif" 
          alt="DJ Boombox" 
          className="absolute inset-0 min-w-screen min-h-dvh sm:w-full sm:h-full  z-0 opacity-100"
          style={{ filter: 'hue-rotate(280deg) brightness(0.5)' }}
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

      <div className="particle-container absolute inset-0 z-30">
        {[...Array(250)].map((_, i) => (
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
          </div>
          <div className="mt-4 md:mt-0 flex items-center">
            {user && (
              <>
                <div className="text-white mr-4 text-sm md:text-base">
                  <span className="text-fuchsia-300">Welcome,</span> {user.displayName || user.email.split('@')[0]}
                </div>
                <button 
                  onClick={handleSignOut}
                  className="py-2 px-4 bg-fuchsia-900 hover:bg-fuchsia-800 text-white rounded-lg font-medium transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="w-full max-w-2xl bg-black/30 backdrop-blur-lg rounded-2xl border border-fuchsia-500/30 p-6 md:p-8 shadow-2xl shadow-fuchsia-900/30">
          {alreadyRegistered ? renderSuccessView() : renderRegistrationForm()}
        </div>
      </div>
    </div>
  );
};

export default Booking;