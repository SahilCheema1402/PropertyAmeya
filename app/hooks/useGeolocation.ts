// hooks/useGeolocation.ts
import { useState, useEffect, useCallback } from 'react';

interface Location {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  address?: string;
}

export function useGeolocation() {
  const [location, setLocation] = useState<Location>({
    latitude: null,
    longitude: null,
    accuracy: null,
    address: undefined
  });
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return Promise.reject('Geolocation not supported');
    }

    return new Promise<void>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setError(null);
          setPermissionStatus('granted');
          resolve();
        },
        (err) => {
          let errorMessage = '';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
              setPermissionStatus('denied');
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. Please try again.';
              break;
            case err.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage = 'An unknown error occurred while retrieving location.';
              break;
          }
          setError(errorMessage);
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }, []);

  useEffect(() => {
    // Check permission status on mount
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionStatus(result.state as any);
        
        if (result.state === 'granted') {
          requestLocation();
        }

        // Listen for permission changes
        result.addEventListener('change', () => {
          setPermissionStatus(result.state as any);
          if (result.state === 'granted') {
            requestLocation();
          } else if (result.state === 'denied') {
            setError('Location access denied. Please enable location permissions in your browser settings.');
            setLocation({ latitude: null, longitude: null, accuracy: null });
          }
        });
      }).catch(() => {
        // Fallback if permissions API is not supported
        setPermissionStatus('unknown');
      });
    } else {
      // Fallback if permissions API is not supported
      setPermissionStatus('unknown');
    }
  }, [requestLocation]);

  return { 
    location, 
    error, 
    permissionStatus,
    requestLocation 
  };
}