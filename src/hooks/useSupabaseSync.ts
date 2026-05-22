import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

/**
 * Syncs a data blob to Supabase for logged-in users, localStorage for guests.
 * On first login, existing localStorage data is migrated to Supabase automatically.
 */
export function useSupabaseSync<T>(feature: string, localKey: string) {
  const { user } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (user) {
        const { data: row } = await supabase
          .from('user_data')
          .select('data')
          .eq('user_id', user.id)
          .eq('feature', feature)
          .maybeSingle();

        if (cancelled) return;

        if (row?.data) {
          // Supabase is authoritative when logged in
          setData(row.data as T);
          localStorage.setItem(localKey, JSON.stringify(row.data));
        } else {
          // No cloud data yet — migrate whatever's in localStorage
          const raw = localStorage.getItem(localKey);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as T;
              setData(parsed);
              // Push to Supabase (best-effort)
              supabase.from('user_data').upsert(
                { user_id: user.id, feature, data: parsed },
                { onConflict: 'user_id,feature' }
              );
            } catch {
              setData(null);
            }
          } else {
            setData(null);
          }
        }
      } else {
        // Guest — localStorage only
        const raw = localStorage.getItem(localKey);
        if (raw) {
          try {
            setData(JSON.parse(raw) as T);
          } catch {
            setData(null);
          }
        } else {
          setData(null);
        }
      }

      if (!cancelled) setIsLoaded(true);
    }

    setIsLoaded(false);
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, feature, localKey]);

  const save = useCallback((newData: T) => {
    setData(newData);
    localStorage.setItem(localKey, JSON.stringify(newData));

    if (userRef.current) {
      supabase.from('user_data').upsert(
        { user_id: userRef.current.id, feature, data: newData },
        { onConflict: 'user_id,feature' }
      );
    }
  }, [feature, localKey]);

  const clear = useCallback(() => {
    setData(null);
    localStorage.removeItem(localKey);

    if (userRef.current) {
      supabase.from('user_data')
        .delete()
        .eq('user_id', userRef.current.id)
        .eq('feature', feature);
    }
  }, [feature, localKey]);

  return { data, isLoaded, save, clear };
}
