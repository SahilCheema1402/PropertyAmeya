'use client';

import { useCheckInMutation, useCheckOutMutation } from '@app/_api_query/attendance/attendance.api';
import { toast } from 'sonner';
import { useGeolocation } from '@app/hooks/useGeolocation';
import { Button } from '@headlessui/react';
import { Loader2, LogIn, LogOut, MapPin, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface Location {
  latitude: number | null;
  longitude: number | null;
  address?: string;
}

export default function CheckInOutButton({ status }: { status: any }) {
  const [checkIn, { isLoading: isCheckingIn }] = useCheckInMutation();
  const [checkOut, { isLoading: isCheckingOut }] = useCheckOutMutation();
  const { location, error: locationError, permissionStatus, requestLocation } = useGeolocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [showLocation, setShowLocation] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const comUserId = JSON.parse(localStorage.getItem('comUserId') || '{}');
    setUserId(comUserId?.userId || user?._id || null);
  }, []);

  const handleLocationRequest = async () => {
    try {
      await requestLocation();
      toast.success('Location access granted!');
    } catch (error) {
      toast.error('Failed to get location. Please check your browser settings.');
    }
  };

  const getAddress = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      return data.display_name || 'Address not available';
    } catch (error) {
      console.error('Geocoding error:', error);
      return 'Address not available';
    }
  };

  const handleCheckIn = async () => {
    if (!userId) {
      toast.error('User session expired. Please log in again.');
      return;
    }

    // If location permission is not granted, request it first
    if (permissionStatus === 'prompt' || permissionStatus === 'unknown') {
      try {
        await requestLocation();
      } catch (error) {
        return; // Error already handled in requestLocation
      }
    }

    if (permissionStatus === 'denied' || locationError) {
      toast.error('Please enable location services to check in');
      return;
    }

    const { latitude, longitude } = location;
    if (!latitude || !longitude) {
      toast.error('Fetching your location... Please try again shortly.');
      return;
    }

    try {
      const address = await getAddress(latitude, longitude);
      await checkIn({ userId, lat: latitude, lng: longitude, address }).unwrap();
      toast.success('Checked in successfully', {
        description: `At ${new Date().toLocaleTimeString()}`,
      });
    } catch (err: any) {
      console.error('Check-in error:', err);
      toast.error(err?.data?.message || 'Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    // If location permission is not granted, request it first
    if (permissionStatus === 'prompt' || permissionStatus === 'unknown') {
      try {
        await requestLocation();
      } catch (error) {
        return; // Error already handled in requestLocation
      }
    }

    if (permissionStatus === 'denied' || locationError) {
      toast.error('Location services required for check-out');
      return;
    }

    const { latitude, longitude } = location;
    if (!latitude || !longitude) {
      toast.error('Getting your location... Please wait.');
      return;
    }

    try {
      const address = await getAddress(latitude, longitude);
      await checkOut({ userId, lat: latitude, lng: longitude, address }).unwrap();
      toast.success('Checked out successfully', {
        description: `At ${new Date().toLocaleTimeString()}`,
      });
    } catch (err: any) {
      console.error('Check-out error:', err);
      toast.error(err?.data?.message || 'Failed to check out');
    }
  };

  if (!userId) return null;

  // Show location permission prompt if needed
  if (permissionStatus === 'denied') {
    return (
      <div className="flex flex-col gap-3">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Location Access Required</span>
          </div>
          <p className="text-sm text-red-600 mb-3">
            Please enable location permissions in your browser settings to use check-in/check-out functionality.
          </p>
          <Button
            onClick={handleLocationRequest}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm transition"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (permissionStatus === 'prompt' || permissionStatus === 'unknown') {
    return (
      <div className="flex flex-col gap-3">
        <Button
          onClick={handleLocationRequest}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg transition-all font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg"
        >
          <MapPin className="h-5 w-5" />
          <span>Enable Location Access</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {status?.checkedOut ? (
        <div className="flex items-center gap-2 text-white font-semibold">
          <LogOut className="h-5 w-5 text-white" />
          <span className="text-sm">Completed for today</span>
        </div>
      ) : status?.checkedIn ? (
        <div className="flex flex-col gap-4">
          {/* Check Out Button */}
          <Button
            onClick={handleCheckOut}
            disabled={isCheckingOut}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg transition-all font-semibold text-white
              ${isCheckingOut
                ? 'bg-red-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg'
              }`}
          >
            {isCheckingOut ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
            <span>Check Out</span>
          </Button>

          {/* Toggle Location View */}
          <Button
            type="button"
            onClick={() => setShowLocation(!showLocation)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:underline transition"
          >
            <MapPin className="h-4 w-4" />
            {showLocation ? 'Hide' : 'View'} Current Location
          </Button>

          {/* Location Details */}
          {showLocation && location && (
            <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p><strong>Latitude:</strong> {location.latitude?.toFixed(6)}</p>
              <p><strong>Longitude:</strong> {location.longitude?.toFixed(6)}</p>
              <p><strong>Address:</strong> {location.address ?? 'Not available'}</p>
            </div>
          )}
        </div>
      ) : (
        // Check In Button
        <Button
          onClick={handleCheckIn}
          disabled={isCheckingIn}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg transition-all font-semibold text-white
            ${isCheckingIn
              ? 'bg-green-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg'
            }`}
        >
          {isCheckingIn ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogIn className="h-5 w-5" />
          )}
          <span>Check In</span>
        </Button>
      )}
    </div>
  );
}