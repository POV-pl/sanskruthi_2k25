// CheckInOut.jsx
import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, where, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase'; // Make sure path is correct
import jsQR from 'jsqr'; // Import jsQR directly

const CheckInOut = () => {
  const [activeTab, setActiveTab] = useState('check-in');
  const [scanning, setScanning] = useState(true); // Start scanning by default
  const [cameraError, setCameraError] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [attendee, setAttendee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [checkedInList, setCheckedInList] = useState([]);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null); // Store stream reference
  const animationRef = useRef(null); // Store animation frame ID
  const scanIntervalRef = useRef(null); // For continuous scanning

  // Start camera automatically when component mounts and handle cleanup
  useEffect(() => {
    console.log("Component mounted, starting camera automatically");
    startCamera();
    fetchCheckedInAttendees();
    
    // Clean up resources when component unmounts
    return () => {
      stopCamera();
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  // Restart camera when tab changes
  useEffect(() => {
    stopCamera();
    startCamera();
  }, [activeTab]);

  // Fetch all checked-in attendees
  const fetchCheckedInAttendees = async () => {
    try {
      const checkedInRef = collection(db, "checkedIn");
      const snapshot = await getDocs(checkedInRef);
      const attendees = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.userId) {
          const registrationQuery = query(
            collection(db, "registrations"), 
            where("userId", "==", data.userId)
          );
          const registrationSnapshot = await getDocs(registrationQuery);
          
          if (!registrationSnapshot.empty) {
            const registrationData = registrationSnapshot.docs[0].data();
            attendees.push({
              ...registrationData,
              checkInTime: data.checkInTime,
              checkInId: doc.id
            });
          }
        }
      }
      
      setCheckedInList(attendees);
    } catch (error) {
      console.error("Error fetching checked-in attendees:", error);
      setMessage({ text: "Failed to load checked-in attendees", type: "error" });
    }
  };

  // Start camera and QR scanning
  const startCamera = async () => {
    if (attendee) {
      // If we have an attendee, don't start the camera
      return;
    }
    
    try {
      // Reset states
      setScannedData(null);
      setCameraError(null);
      
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Clear any existing animation frames
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      // Try to access camera with appropriate constraints
      const constraints = { 
        video: { 
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      };
      
      console.log("Requesting camera access with constraints:", constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Store stream in ref for later cleanup
      streamRef.current = stream;
      
      if (videoRef.current) {
        console.log("Setting video source");
        videoRef.current.srcObject = stream;
        
        // Wait for video to be loaded before starting scan
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          videoRef.current.play()
            .then(() => {
              console.log("Video playback started successfully");
              setScanning(true);
              // Start scanning in a loop
              scanQRCode();
            })
            .catch(err => {
              console.error("Error starting video playback:", err);
              setCameraError("Failed to start video playback. Please refresh the page.");
            });
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      if (error.name === 'NotAllowedError') {
        setCameraError("Camera access denied. Please allow camera access in your browser settings and refresh the page.");
      } else if (error.name === 'NotFoundError') {
        setCameraError("No camera found. Please make sure your device has a camera.");
      } else {
        setCameraError(`Unable to access camera: ${error.message}`);
      }
      setScanning(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    // Cancel any ongoing animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Stop any scanning interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setScanning(false);
  };

  // Process frames to scan QR codes
  const scanQRCode = () => {
    if (!scanning || !videoRef.current || !canvasRef.current) {
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Make sure video is ready
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      // Not enough video data available yet, try again soon
      animationRef.current = requestAnimationFrame(scanQRCode);
      return;
    }
    
    const context = canvas.getContext('2d', { willReadFrequently: true });
    
    // Match canvas dimensions to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      // Get image data for QR code scanning
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Try to find QR code in the image
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      
      if (code) {
        console.log("QR Code detected:", code.data);
        
        // Only process the code if we don't already have attendee data
        if (!attendee && !loading) {
          setScannedData(code.data);
          lookupAttendee(code.data);
          // Don't stop camera here, just pause scanning while processing
          setScanning(false);
        }
      } else {
        // Continue scanning if no QR code found and no attendee being processed
        if (!attendee && !loading) {
          animationRef.current = requestAnimationFrame(scanQRCode);
        }
      }
    } catch (error) {
      console.error("Error scanning QR code:", error);
      // Continue scanning despite error
      animationRef.current = requestAnimationFrame(scanQRCode);
    }
  };

  // Look up attendee details based on scanned QR code (userId)
  const lookupAttendee = async (userId) => {
    setLoading(true);
    try {
      // Search for registration with this userId
      const registrationsRef = collection(db, "registrations");
      const q = query(registrationsRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setMessage({ 
          text: "No registration found for this QR code.", 
          type: "error" 
        });
        setAttendee(null);
        // Restart scanning after a brief pause
        setTimeout(() => {
          if (!attendee) {
            setScanning(true);
            scanQRCode();
          }
        }, 2000);
      } else {
        const registrationData = querySnapshot.docs[0].data();
        
        // If checking in, check if already checked in
        if (activeTab === 'check-in') {
          const checkedInRef = collection(db, "checkedIn");
          const checkedInQuery = query(checkedInRef, where("userId", "==", userId));
          const checkedInSnapshot = await getDocs(checkedInQuery);
          
          if (!checkedInSnapshot.empty) {
            const checkInData = checkedInSnapshot.docs[0].data();
            setMessage({ 
              text: `This attendee is already checked in (${new Date(checkInData.checkInTime.toDate()).toLocaleString()})`, 
              type: "warning" 
            });
          }
        } 
        // If checking out, verify they are checked in
        else if (activeTab === 'check-out') {
          const checkedInRef = collection(db, "checkedIn");
          const checkedInQuery = query(checkedInRef, where("userId", "==", userId));
          const checkedInSnapshot = await getDocs(checkedInQuery);
          
          if (checkedInSnapshot.empty) {
            setMessage({ 
              text: "This attendee has not checked in yet.", 
              type: "warning" 
            });
          } else {
            const checkInDoc = checkedInSnapshot.docs[0];
            registrationData.checkInId = checkInDoc.id;
          }
        }
        
        setAttendee(registrationData);
      }
    } catch (error) {
      console.error("Error looking up attendee:", error);
      setMessage({ 
        text: "Error looking up attendee information.", 
        type: "error" 
      });
      // Restart scanning after error
      setTimeout(() => {
        if (!attendee) {
          setScanning(true);
          scanQRCode();
        }
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  // Handle check-in process
  const handleCheckIn = async () => {
    if (!attendee || !attendee.userId) return;
    
    setLoading(true);
    try {
      // Add to checkedIn collection
      await addDoc(collection(db, "checkedIn"), {
        userId: attendee.userId,
        fullName: attendee.fullName,
        checkInTime: new Date()
      });
      
      setMessage({ 
        text: `Successfully checked in ${attendee.fullName}!`, 
        type: "success" 
      });
      
      // Refresh checked-in list
      await fetchCheckedInAttendees();
      
      // Auto-reset after successful check-in
      setTimeout(() => {
        resetScan();
      }, 3000);
    } catch (error) {
      console.error("Error during check-in:", error);
      setMessage({ 
        text: "Failed to check in attendee.", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle check-out process
  const handleCheckOut = async () => {
    if (!attendee || !attendee.checkInId) return;
    
    setLoading(true);
    try {
      // Delete from checkedIn collection
      await deleteDoc(doc(db, "checkedIn", attendee.checkInId));
      
      setMessage({ 
        text: `Successfully checked out ${attendee.fullName}!`, 
        type: "success" 
      });
      
      // Refresh checked-in list
      await fetchCheckedInAttendees();
      
      // Auto-reset after successful check-out
      setTimeout(() => {
        resetScan();
      }, 3000);
    } catch (error) {
      console.error("Error during check-out:", error);
      setMessage({ 
        text: "Failed to check out attendee.", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset the current scan and restart camera
  const resetScan = () => {
    setScannedData(null);
    setAttendee(null);
    setMessage({ text: '', type: '' });
    
    // Start camera again for new scan
    startCamera();
  };

  // Switch between check-in and check-out tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    resetScan();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-purple-900 text-white p-4">
      {/* Header with title */}
      <div className="w-full text-center mb-6">
        <h1 className="font-['Orbitron'] text-3xl sm:text-4xl font-bold tracking-wider"
            style={{ textShadow: '0 0 7px #ff00ff, 0 0 10px #ff00ff, 0 0 21px #ff00ff' }}>
          SANSKRUTHI 2K25
        </h1>
        <p className="text-fuchsia-300 mt-2">
          May 17, 2025 | Dr. Ambedkar Institute of Technology
        </p>
      </div>
      
      {/* Main content container */}
      <div className="max-w-3xl mx-auto bg-black/40 backdrop-blur-sm rounded-xl border border-fuchsia-500/30 overflow-hidden"
           style={{ boxShadow: '0 0 15px rgba(196, 23, 224, 0.3)' }}>
        
        {/* Tab navigation */}
        <div className="flex">
          <button 
            className={`flex-1 py-4 font-medium text-center transition-all ${
              activeTab === 'check-in' 
                ? 'bg-fuchsia-900/50 border-b-2 border-fuchsia-500' 
                : 'bg-black/60 border-b border-fuchsia-500/30 text-fuchsia-300'
            }`}
            onClick={() => handleTabChange('check-in')}
          >
            Check In
          </button>
          <button 
            className={`flex-1 py-4 font-medium text-center transition-all ${
              activeTab === 'check-out' 
                ? 'bg-fuchsia-900/50 border-b-2 border-fuchsia-500' 
                : 'bg-black/60 border-b border-fuchsia-500/30 text-fuchsia-300'
            }`}
            onClick={() => handleTabChange('check-out')}
          >
            Check Out
          </button>
        </div>
        
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {activeTab === 'check-in' ? 'Attendee Check In' : 'Attendee Check Out'}
          </h2>
          
          {/* Camera and scanning UI */}
          <div className="mb-6">
            <div className="relative w-full max-w-md mx-auto">
              {/* Always show video element */}
              <video 
                ref={videoRef} 
                className={`w-full h-64 object-cover border-2 border-fuchsia-500 rounded-lg ${scanning ? '' : 'opacity-50'}`}
                muted 
                playsInline
                autoPlay
              />
              <canvas 
                ref={canvasRef} 
                className="absolute top-0 left-0 w-full h-full hidden"
              />
              
              {/* Scanner overlay - only show when actively scanning */}
              {scanning && !attendee && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-fuchsia-500 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-fuchsia-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-fuchsia-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-fuchsia-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-fuchsia-500 rounded-br-lg"></div>
                  </div>
                </div>
              )}
              
              {/* Scanning indicator */}
              {scanning && !attendee && (
                <div className="absolute inset-x-0 top-2 flex justify-center">
                  <div className="bg-black/60 px-3 py-1 rounded-full flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm">Scanning for QR Code</span>
                  </div>
                </div>
              )}
              
              {/* Camera error message */}
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <div className="bg-red-900/80 p-4 rounded-lg max-w-xs text-center">
                    <p className="text-white mb-3">{cameraError}</p>
                    <button 
                      onClick={() => {
                        setCameraError(null);
                        startCamera();
                      }}
                      className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Status message */}
          {message.text && (
            <div className={`mb-6 p-4 border rounded-lg ${
              message.type === 'success' ? 'bg-green-900/40 border-green-500/50 text-green-100' :
              message.type === 'error' ? 'bg-red-900/40 border-red-500/50 text-red-100' :
              'bg-yellow-900/40 border-yellow-500/50 text-yellow-100'
            }`}>
              <p>{message.text}</p>
            </div>
          )}
          
          {/* Attendee details */}
          {loading ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin h-8 w-8 border-4 border-fuchsia-500 border-t-transparent rounded-full"></div>
            </div>
          ) : attendee ? (
            <div className="bg-fuchsia-900/20 border border-fuchsia-500/30 rounded-lg p-5 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                {/* Attendee photo */}
                <img 
                  src={attendee.imageUrl} 
                  alt={attendee.fullName} 
                  className="w-28 h-28 object-cover rounded-lg border-2 border-fuchsia-500"
                />
                
                {/* Attendee info */}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white">{attendee.fullName}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <p className="text-fuchsia-300"><span className="text-white">Email:</span> {attendee.email}</p>
                    <p className="text-fuchsia-300"><span className="text-white">Phone:</span> {attendee.phone}</p>
                    {attendee.usn && <p className="text-fuchsia-300"><span className="text-white">USN:</span> {attendee.usn}</p>}
                    <p className="text-fuchsia-300"><span className="text-white">College:</span> {attendee.collegeName}</p>
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {activeTab === 'check-in' ? (
                  <button
                    onClick={handleCheckIn}
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-green-700 hover:bg-green-800 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Admit Attendee
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleCheckOut}
                    disabled={loading || !attendee.checkInId}
                    className="flex-1 py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Check Out Attendee
                      </>
                    )}
                  </button>
                )}
                
                <button
                  onClick={resetScan}
                  className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-medium transition-all"
                >
                  Scan New Code
                </button>
              </div>
            </div>
          ) : null}
          
          {/* Checked-in attendees list */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <span>Checked-In Attendees</span>
              <span className="ml-2 bg-fuchsia-700 text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                {checkedInList.length}
              </span>
            </h3>
            
            {checkedInList.length > 0 ? (
              <div className="overflow-auto max-h-64 border border-fuchsia-500/30 rounded-lg">
                <table className="min-w-full">
                  <thead className="bg-fuchsia-900/50">
                    <tr>
                      <th className="py-2 px-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                      <th className="py-2 px-3 text-left text-xs font-medium uppercase tracking-wider">College</th>
                      <th className="py-2 px-3 text-left text-xs font-medium uppercase tracking-wider">Check In Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-fuchsia-500/20">
                    {checkedInList.map((attendee, index) => (
                      <tr key={index} className="hover:bg-fuchsia-900/20">
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <img 
                              src={attendee.imageUrl} 
                              alt={attendee.fullName}
                              className="h-8 w-8 rounded-full mr-2 object-cover" 
                            />
                            <span>{attendee.fullName}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">{attendee.collegeName}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {attendee.checkInTime ? new Date(attendee.checkInTime.toDate()).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 border border-fuchsia-500/30 rounded-lg bg-fuchsia-900/10">
                <p className="text-fuchsia-300">No attendees have checked in yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-center opacity-70">
        <p>© Sanskruthi 2K25 Event Management System</p>
      </div>
    </div>
  );
};

export default CheckInOut;