// CheckInOut.jsx
import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, where, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase'; // Make sure path is correct
import jsQR from 'jsqr'; // Import jsQR directly

// Admin authentication details
const ADMIN_CODE = "RK72KP16@CPP"; // You can change this to any secure admin code

const CheckInOut = () => {
  const [activeTab, setActiveTab] = useState('check-in');
  const [scanning, setScanning] = useState(false); // Don't start scanning until authenticated
  const [cameraError, setCameraError] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [attendee, setAttendee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [checkedInList, setCheckedInList] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [showAttendeeList, setShowAttendeeList] = useState(true);
  const [lastScanTime, setLastScanTime] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null); // Store stream reference
  const animationRef = useRef(null); // Store animation frame ID
  const scanIntervalRef = useRef(null); // For continuous scanning

  // Start camera only after authentication
  useEffect(() => {
    if (isAuthenticated) {
      console.log("Authenticated, starting camera");
      startCamera();
      fetchCheckedInAttendees();
    }

    // Clean up resources when component unmounts
    return () => {
      stopCamera();
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [isAuthenticated]);

  // Restart camera when tab changes
  useEffect(() => {
    if (isAuthenticated) {
      stopCamera();
      startCamera();
    }
  }, [activeTab]);

  // Handle admin authentication
  const handleAuthentication = () => {
    if (adminCode === ADMIN_CODE) {
      setIsAuthenticated(true);
      setMessage({ text: "Admin authenticated successfully", type: "success" });
      // Clear the message after 3 seconds
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } else {
      setMessage({ text: "Invalid admin code", type: "error" });
    }
  };

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

  // Process frames to scan QR codes with optimization for speed
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

    // Throttle scanning to improve performance (max one scan every 200ms)
    const now = Date.now();
    if (now - lastScanTime < 200) {
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
        setLastScanTime(now);

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
        }, 1000); // Reduced from 2000 to 1000ms for faster recovery
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
      }, 1000); // Reduced from 2000 to 1000ms for faster recovery
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
      }, 2000); // Reduced from 3000 to 2000ms for faster workflow
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
      }, 2000); // Reduced from 3000 to 2000ms for faster workflow
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

  // Toggle visibility of the attendee list
  const toggleAttendeeList = () => {
    setShowAttendeeList(!showAttendeeList);
  };

  // Log out function
  const handleLogout = () => {
    stopCamera();
    setIsAuthenticated(false);
    setAdminCode('');
    setAttendee(null);
    setScannedData(null);
    setMessage({ text: '', type: '' });
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

      {/* Auth check - if not authenticated, show login screen */}
      {!isAuthenticated ? (
        <div className="max-w-md mx-auto bg-black/40 backdrop-blur-sm rounded-xl border border-fuchsia-500/30 overflow-hidden p-6"
          style={{ boxShadow: '0 0 15px rgba(196, 23, 224, 0.3)' }}>
          <h2 className="text-xl font-semibold mb-6 text-center">Admin Authentication Required</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="adminCode" className="block text-sm font-medium mb-1">Enter Admin Code:</label>
              <input
                type="password"
                id="adminCode"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className="w-full bg-black/60 border border-fuchsia-500/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                placeholder="Enter Admin Code"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAuthentication();
                  }
                }}
              />
            </div>

            {message.text && (
              <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-900/40 border border-green-500/50 text-green-100' :
                  message.type === 'error' ? 'bg-red-900/40 border border-red-500/50 text-red-100' :
                    'bg-yellow-900/40 border border-yellow-500/50 text-yellow-100'
                }`}>
                <p>{message.text}</p>
              </div>
            )}

            <button
              onClick={handleAuthentication}
              className="w-full py-3 px-4 bg-fuchsia-700 hover:bg-fuchsia-800 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Authenticate
            </button>
          </div>
        </div>
      ) : (
        /* Main content container - only shown when authenticated */
        <div className="max-w-3xl mx-auto bg-black/40 backdrop-blur-sm rounded-xl border border-fuchsia-500/30 overflow-hidden"
          style={{ boxShadow: '0 0 15px rgba(196, 23, 224, 0.3)' }}>

          {/* Admin controls */}
          <div className="bg-fuchsia-900/30 p-3 border-b border-fuchsia-500/30 flex justify-between items-center">
            <div className="flex items-center">
              <span className="bg-green-600 h-2 w-2 rounded-full mr-2"></span>
              <span className="text-sm">Admin Mode Active</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleAttendeeList}
                className="text-xs px-3 py-1 bg-fuchsia-800 hover:bg-fuchsia-700 rounded-md transition-all flex items-center gap-1"
              >
                {showAttendeeList ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    Hide List
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Show List
                  </>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="text-xs px-3 py-1 bg-red-800 hover:bg-red-700 rounded-md transition-all flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex">
            <button
              className={`flex-1 py-4 font-medium text-center transition-all ${activeTab === 'check-in'
                  ? 'bg-fuchsia-900/50 border-b-2 border-fuchsia-500'
                  : 'bg-black/60 border-b border-fuchsia-500/30 text-fuchsia-300'
                }`}
              onClick={() => handleTabChange('check-in')}
            >
              Check In
            </button>
            <button
              className={`flex-1 py-4 font-medium text-center transition-all ${activeTab === 'check-out'
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
              <div className={`mb-6 p-4 border rounded-lg ${message.type === 'success' ? 'bg-green-900/40 border-green-500/50 text-green-100' :
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
                          Check In Attendee
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleCheckOut}
                      disabled={loading}
                      className="flex-1 py-3 px-4 bg-red-700 hover:bg-red-800 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
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
                    className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    New Scan
                  </button>
                </div>
              </div>
            ) : null}

            {/* Checked-in attendees list (only shown when toggled) */}
            {showAttendeeList && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {activeTab === 'check-in' ? 'Checked-In Attendees' : 'Available for Check-Out'}
                    <span className="ml-2 bg-fuchsia-900 text-white text-xs px-2 py-1 rounded-full">
                      {checkedInList.length}
                    </span>
                  </h3>
                </div>

                {checkedInList.length > 0 ? (
                  <div className="bg-black/60 border border-fuchsia-500/30 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-64 scrollbar-thin scrollbar-thumb-fuchsia-900 scrollbar-track-black/40">
                      <table className="min-w-full divide-y divide-fuchsia-500/20">
                        <thead className="bg-fuchsia-900/30">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-fuchsia-200 uppercase tracking-wider">
                              Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-fuchsia-200 uppercase tracking-wider hidden sm:table-cell">
                              College
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-fuchsia-200 uppercase tracking-wider">
                              Check-In Time
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-fuchsia-500/20">
                          {checkedInList.map((attendee, index) => (
                            <tr key={attendee.userId || index} className="hover:bg-fuchsia-900/10">
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex items-center">
                                  <img className="h-8 w-8 rounded-full mr-3 object-cover border border-fuchsia-500/50" src={attendee.imageUrl} alt="" />
                                  <div>
                                    <div className="font-medium">{attendee.fullName}</div>
                                    <div className="text-fuchsia-300 text-xs sm:hidden">{attendee.collegeName}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-fuchsia-300 hidden sm:table-cell">
                                {attendee.collegeName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-fuchsia-300">
                                {attendee.checkInTime ? new Date(attendee.checkInTime.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/60 border border-fuchsia-500/30 rounded-lg p-8 text-center">
                    <p className="text-fuchsia-300">No attendees have checked in yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInOut;