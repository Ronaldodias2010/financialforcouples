import { useState, useEffect } from 'react';

export interface GeolocationData {
  country: string;
  countryCode: string;
  currency: string;
  language: string;
  inBrazil: boolean;
}

const defaultLocation: GeolocationData = {
  country: 'Brazil',
  countryCode: 'BR',
  currency: 'BRL',
  language: 'pt',
  inBrazil: true
};

// Map of countries to their default settings
const COUNTRY_SETTINGS: Record<string, Partial<GeolocationData>> = {
  'BR': { country: 'Brazil', countryCode: 'BR', currency: 'BRL', language: 'pt', inBrazil: true },
  'US': { country: 'United States', countryCode: 'US', currency: 'USD', language: 'en', inBrazil: false },
  'CA': { country: 'Canada', countryCode: 'CA', currency: 'USD', language: 'en', inBrazil: false },
  'GB': { country: 'United Kingdom', countryCode: 'GB', currency: 'USD', language: 'en', inBrazil: false },
  'ES': { country: 'Spain', countryCode: 'ES', currency: 'EUR', language: 'es', inBrazil: false },
  'MX': { country: 'Mexico', countryCode: 'MX', currency: 'USD', language: 'es', inBrazil: false },
  'AR': { country: 'Argentina', countryCode: 'AR', currency: 'USD', language: 'es', inBrazil: false },
  'PT': { country: 'Portugal', countryCode: 'PT', currency: 'EUR', language: 'pt', inBrazil: false },
};

export const useGeolocation = () => {
  const [location, setLocation] = useState<GeolocationData>(defaultLocation);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const detectLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try multiple geolocation APIs for better reliability
      const apis = [
        'https://ipapi.co/json/',
        'https://api.ipgeolocation.io/ipgeo?apiKey=free',
        'https://ip-api.com/json/'
      ];

      let locationData: GeolocationData = defaultLocation;

      for (const api of apis) {
        try {
          const response = await fetch(api, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            const countryCode = data.country_code || data.country_code2 || data.countryCode || 'BR';
            
            const settings = COUNTRY_SETTINGS[countryCode] || COUNTRY_SETTINGS['BR'];
            
            locationData = {
              country: data.country || data.country_name || settings.country || 'Brazil',
              countryCode: countryCode,
              currency: settings.currency || 'BRL',
              language: settings.language || 'pt',
              inBrazil: countryCode === 'BR'
            };
            
            console.log('✅ Location detected:', locationData);
            break; // Stop trying other APIs if one succeeds
          }
        } catch (apiError) {
          console.warn(`Failed to get location from ${api}:`, apiError);
          continue; // Try next API
        }
      }

      setLocation(locationData);
      
      // Store in localStorage for future use
      localStorage.setItem('userLocation', JSON.stringify(locationData));
      
    } catch (err) {
      console.error('Error detecting location:', err);
      setError('Failed to detect location');
      
      // Try to load from localStorage as fallback
      const stored = localStorage.getItem('userLocation');
      if (stored) {
        try {
          setLocation(JSON.parse(stored));
        } catch (parseError) {
          setLocation(defaultLocation);
        }
      } else {
        setLocation(defaultLocation);
      }
    } finally {
      setLoading(false);
    }
  };

  const forceUpdate = (newLocation: Partial<GeolocationData>) => {
    const updated = { ...location, ...newLocation };
    setLocation(updated);
    localStorage.setItem('userLocation', JSON.stringify(updated));
    console.log('🔄 Location manually updated:', updated);
  };

  useEffect(() => {
    // Check localStorage first
    const stored = localStorage.getItem('userLocation');
    if (stored) {
      try {
        const storedLocation = JSON.parse(stored);
        setLocation(storedLocation);
        setLoading(false);
        console.log('📍 Loaded location from storage:', storedLocation);
        return;
      } catch (parseError) {
        console.warn('Failed to parse stored location, detecting fresh');
      }
    }

    // If no stored data or parsing failed, detect location
    detectLocation();
  }, []);

  return {
    location,
    loading,
    error,
    detectLocation,
    forceUpdate,
    isInternational: !location.inBrazil
  };
};