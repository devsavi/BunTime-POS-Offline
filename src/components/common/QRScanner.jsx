import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';

const QRScanner = ({ isOpen, onClose, onScanSuccess, onScanError }) => {
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);

  useEffect(() => {
    if (isOpen && !scannerInstanceRef.current) {
      initializeScanner();
    }

    return () => {
      cleanupScanner();
    };
  }, [isOpen]);

  const initializeScanner = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Check if camera is available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        throw new Error('No camera found on this device');
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
        videoConstraints: {
          facingMode: { ideal: "environment" }, // Prefer back camera but allow front
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
        // Remove supportedScanTypes to use default behavior
      };

      const scanner = new Html5QrcodeScanner("qr-reader", config, false);
      scannerInstanceRef.current = scanner;

      scanner.render(
        (decodedText, decodedResult) => {
          // Success callback
          console.log('QR Code scanned:', decodedText);
          handleScanSuccess(decodedText, decodedResult);
        },
        (error) => {
          // Error callback - this fires frequently during scanning, so we don't show all errors
          if (error.includes('NotAllowedError')) {
            setError('Camera access denied. Please allow camera permissions.');
            setIsScanning(false);
          }
        }
      );

      // Wait a bit for scanner to initialize
      setTimeout(() => {
        setIsScanning(false);
      }, 2000);
    } catch (err) {
      console.error('Error initializing QR scanner:', err);
      setError('Failed to initialize camera. Please check camera permissions.');
      setIsScanning(false);
    }
  };

  const handleScanSuccess = async (decodedText, decodedResult) => {
    try {
      await cleanupScanner();
      if (onScanSuccess) {
        onScanSuccess(decodedText, decodedResult);
      }
      onClose();
    } catch (err) {
      console.error('Error handling scan success:', err);
      setError('Error processing scanned code');
    }
  };

  const cleanupScanner = async () => {
    if (scannerInstanceRef.current) {
      try {
        await scannerInstanceRef.current.clear();
        scannerInstanceRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('Error cleaning up scanner:', err);
        // Force cleanup even if there's an error
        scannerInstanceRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const handleClose = async () => {
    await cleanupScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Scan Barcode/QR Code
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Content */}
        <div className="p-4">
          {error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Camera Error
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error}
              </p>
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <p>Please ensure:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Camera permissions are granted</li>
                  <li>Camera is not being used by another application</li>
                  <li>You're using HTTPS (required for camera access)</li>
                </ul>
              </div>
              <button
                onClick={async () => {
                  setError(null);
                  await initializeScanner();
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Scanner Container */}
              <div className="relative">
                <div 
                  id="qr-reader" 
                  className="w-full"
                  style={{ minHeight: '300px' }}
                />
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Initializing camera...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-2">
                  <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Scanning Instructions:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Position the barcode/QR code within the scanning area</li>
                      <li>• Ensure good lighting for better recognition</li>
                      <li>• Hold steady until the code is detected</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;