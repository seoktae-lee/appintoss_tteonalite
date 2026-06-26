import { useState, useCallback, useEffect } from "react";
import { api } from "../api/client";
import type { TodaySession, Place } from "../api/types";

export function useTodaySession() {
  const [session, setSession] = useState<TodaySession | null>(null);
  const [loading, setLoading] = useState(false);

  const checkActive = useCallback(async () => {
    try {
      const res = await api.get<{ session: TodaySession | null }>("/api/courses/today/active");
      setSession(res.session);
    } catch {}
  }, []);

  useEffect(() => { checkActive(); }, [checkActive]);

  const startSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.post<{ session: TodaySession }>("/api/courses/today/start");
      setSession(res.session);
      return res.session;
    } finally { setLoading(false); }
  }, []);

  const addPlace = useCallback(async (data: { lat: number; lng: number; memo?: string; placeName?: string; photoUrl?: string }) => {
    setLoading(true);
    try {
      const res = await api.post<{ session: TodaySession; place: Place }>("/api/courses/today/add-place", data);
      setSession(res.session);
      return res.place;
    } finally { setLoading(false); }
  }, []);

  const finishSession = useCallback(async (data: { title?: string; tag?: string; isPublic?: boolean }) => {
    setLoading(true);
    try {
      const res = await api.post<{ course: any }>("/api/courses/today/finish", data);
      setSession(null);
      return res.course;
    } finally { setLoading(false); }
  }, []);

  return { session, loading, startSession, addPlace, finishSession, checkActive };
}
