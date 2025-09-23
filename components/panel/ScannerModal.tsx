import React, { useState, useEffect, useRef } from 'react';
// Fix: Import for side-effects to load global custom JSX element types for ion-icon.
import '../../types';

// This is a browser-API, so we need to declare the type for TypeScript
declare const BarcodeDetector: any;

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('Iniciando cámara...');
  const [isDetectorSupported, setDetectorSupported] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    if (!('BarcodeDetector' in window)) {
      setDetectorSupported(false);
      setStatus('Tu navegador no soporta la detección de códigos de barras.');
      return;
    }
    
    let stream: MediaStream | null = null;
    let animationFrameId: number | null = null;

    const startScan = async () => {
      try {
        setStatus('Solicitando permiso de cámara...');
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStatus('Buscando código...');
          
          const barcodeDetector = new BarcodeDetector({
            formats: ['qr_code', 'ean_13', 'code_128']
          });

          const detectCode = async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) {
              animationFrameId = requestAnimationFrame(detectCode);
              return;
            }
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              setStatus(`Código detectado: ${barcodes[0].rawValue}`);
              onScanSuccess(barcodes[0].rawValue);
            } else {
              animationFrameId = requestAnimationFrame(detectCode);
            }
          };
          detectCode();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setStatus('Error al acceder a la cámara. Revisa los permisos.');
      }
    };

    startScan();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-lg m-4 relative border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Escanear Código</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <ion-icon name="close-outline" style={{ fontSize: '24px' }}></ion-icon>
          </button>
        </div>
        
        <div className="relative w-full aspect-video bg-gray-900 rounded-md overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline />
            <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="w-full h-full border-4 border-dashed border-white/50 rounded-lg"></div>
            </div>
        </div>

        <div className="text-center mt-4 p-2 bg-gray-700 rounded-md">
            <p className="font-semibold text-white">{status}</p>
            {!isDetectorSupported && <p className="text-sm text-yellow-400 mt-1">Intenta usar Chrome en Android o en escritorio para una mejor compatibilidad.</p>}
        </div>
      </div>
    </div>
  );
};