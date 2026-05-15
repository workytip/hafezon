import { useState, useEffect } from 'react';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

export interface PrayerTimesData {
  fajr: Date;
  sunrise: Date;
  duha: Date;   // sunrise + 3 hours
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export type PrayerKey = 'fajr' | 'duha' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

interface UsePrayerTimesResult {
  times: PrayerTimesData | null;
  currentPrayer: PrayerKey | null;
  nextPrayer: PrayerKey | null;
  loading: boolean;
  error: string | null;
  cityName: string | null;
}

const LOCATION_KEY = 'hafezon-location';
const CITY_KEY     = 'hafezon-city';

const ADHAN_TO_KEY: Record<string, PrayerKey> = {
  fajr: 'fajr', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha',
};

function addMinutes(d: Date, m: number) {
  return new Date(d.getTime() + m * 60000);
}

function computeTimes(lat: number, lng: number, date: Date): PrayerTimesData {
  const coords = new Coordinates(lat, lng);
  const params  = CalculationMethod.MuslimWorldLeague();
  const pt      = new PrayerTimes(coords, date, params);
  return {
    fajr:    pt.fajr,
    sunrise: pt.sunrise,
    duha:    addMinutes(pt.sunrise, 180),
    dhuhr:   pt.dhuhr,
    asr:     pt.asr,
    maghrib: pt.maghrib,
    isha:    pt.isha,
  };
}

function getCurrentAndNext(times: PrayerTimesData): { current: PrayerKey | null; next: PrayerKey | null } {
  const now = Date.now();
  const ordered: { key: PrayerKey; time: Date }[] = [
    { key: 'fajr',    time: times.fajr },
    { key: 'duha',    time: times.duha },
    { key: 'dhuhr',   time: times.dhuhr },
    { key: 'asr',     time: times.asr },
    { key: 'maghrib', time: times.maghrib },
    { key: 'isha',    time: times.isha },
  ];

  let current: PrayerKey | null = null;
  let next: PrayerKey | null = null;

  for (let i = 0; i < ordered.length; i++) {
    if (now >= ordered[i].time.getTime()) {
      current = ordered[i].key;
      next = ordered[i + 1]?.key ?? null;
    }
  }
  if (current === null) next = 'fajr';
  return { current, next };
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`
    );
    const data = await res.json();
    return data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
  } catch {
    return '';
  }
}

export function usePrayerTimes(): UsePrayerTimesResult {
  const [times, setTimes]         = useState<PrayerTimesData | null>(null);
  const [currentPrayer, setCurrent] = useState<PrayerKey | null>(null);
  const [nextPrayer, setNext]     = useState<PrayerKey | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [cityName, setCity]       = useState<string | null>(() => localStorage.getItem(CITY_KEY));

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // Try cached coords first
      const cached = localStorage.getItem(LOCATION_KEY);
      if (cached) {
        try {
          const { lat, lng, ts } = JSON.parse(cached);
          // Cache valid for 12 h
          if (Date.now() - ts < 12 * 3600 * 1000) {
            const t = computeTimes(lat, lng, new Date());
            if (!cancelled) { setTimes(t); setLoading(false); }
            const { current, next } = getCurrentAndNext(t);
            if (!cancelled) { setCurrent(current); setNext(next); }
            return;
          }
        } catch { /* invalid cache, fall through */ }
      }

      // Request location
      if (!navigator.geolocation) {
        if (!cancelled) { setError('المتصفح لا يدعم تحديد الموقع'); setLoading(false); }
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          localStorage.setItem(LOCATION_KEY, JSON.stringify({ lat, lng, ts: Date.now() }));

          const t = computeTimes(lat, lng, new Date());
          if (!cancelled) { setTimes(t); setLoading(false); }
          const { current, next } = getCurrentAndNext(t);
          if (!cancelled) { setCurrent(current); setNext(next); }

          // Resolve city name (non-blocking)
          const city = await reverseGeocode(lat, lng);
          if (city) {
            localStorage.setItem(CITY_KEY, city);
            if (!cancelled) setCity(city);
          }
        },
        (err) => {
          if (!cancelled) {
            setError('تعذّر الحصول على الموقع. يرجى السماح بالوصول إليه.');
            setLoading(false);
          }
        },
        { timeout: 10000 }
      );
    };

    init();

    // Refresh current/next every minute
    const interval = setInterval(() => {
      setTimes(prev => {
        if (!prev) return prev;
        const { current, next } = getCurrentAndNext(prev);
        setCurrent(current);
        setNext(next);
        return prev;
      });
    }, 60000);

    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return { times, currentPrayer, nextPrayer, loading, error, cityName };
}
