import { useState, useEffect } from 'react';
import { socketService } from '../services/socketService';

export function useGeolocation(enabled = true) {
  const [location, setLocation] = useState(null);
  const [nearbyShops, setNearbyShops] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let watchId;

    const startWatching = () => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser');
        return;
      }

      setLoading(true);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          setLoading(false);
          setError(null);

          socketService.updateLocation(latitude, longitude);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });

          socketService.updateLocation(latitude, longitude);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError(err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    };

    const handleNearbyShops = (data) => {
      console.log('Received nearby shops:', data);
      setNearbyShops(data.shops || []);
    };

    socketService.onNearbyShops(handleNearbyShops);

    startWatching();

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      socketService.removeListener('nearby_shops', handleNearbyShops);
    };
  }, [enabled]);

  return {
    location,
    nearbyShops,
    error,
    loading
  };
}

export function useNearbyUsers(shopId, enabled = true) {
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [userNearbyNotifications, setUserNearbyNotifications] = useState([]);

  useEffect(() => {
    if (!enabled || !shopId) return;

    const handleNearbyUsers = (data) => {
      console.log('Received nearby users:', data);
      setNearbyUsers(data.users || []);
    };

    const handleUserNearby = (data) => {
      console.log('User nearby notification:', data);
      setUserNearbyNotifications(prev => [...prev, data]);

      setTimeout(() => {
        setUserNearbyNotifications(prev => prev.filter(n => n.timestamp !== data.timestamp));
      }, 10000);
    };

    socketService.onNearbyUsers(handleNearbyUsers);
    socketService.onUserNearby(handleUserNearby);

    socketService.getNearbyUsers();

    const interval = setInterval(() => {
      socketService.getNearbyUsers();
    }, 30000);

    return () => {
      clearInterval(interval);
      socketService.removeListener('nearby_users', handleNearbyUsers);
      socketService.removeListener('user_nearby', handleUserNearby);
    };
  }, [shopId, enabled]);

  return {
    nearbyUsers,
    userNearbyNotifications,
    refreshNearbyUsers: () => socketService.getNearbyUsers()
  };
}
