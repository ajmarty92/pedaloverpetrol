import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { api } from "../api/client";

const QUEUE_KEY = "pop_offline_queue";

export interface QueuedAction {
  id: string;
  type: "status_update" | "pod_submit";
  jobId: string;
  payload: Record<string, unknown>;
  createdAt: string;
  retries: number;
  lastError?: string;
}

interface OfflineContextValue {
  isOnline: boolean;
  queue: QueuedAction[];
  pendingCount: number;
  isFlushing: boolean;
  enqueue: (action: Omit<QueuedAction, "id" | "createdAt" | "retries">) => Promise<void>;
  flush: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue>({
  isOnline: true,
  queue: [],
  pendingCount: 0,
  isFlushing: false,
  enqueue: async () => {},
  flush: async () => {},
});

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function persistQueue(q: QueuedAction[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [isFlushing, setIsFlushing] = useState(false);
  const flushingRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(QUEUE_KEY).then((raw) => {
      if (raw) {
        try { setQueue(JSON.parse(raw)); } catch {}
      }
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
    });
    return unsubscribe;
  }, []);

  const enqueue = useCallback(async (
    action: Omit<QueuedAction, "id" | "createdAt" | "retries">,
  ) => {
    const item: QueuedAction = {
      ...action,
      id: generateId(),
      createdAt: new Date().toISOString(),
      retries: 0,
    };
    setQueue((prev) => {
      const next = [...prev, item];
      persistQueue(next);
      return next;
    });
  }, []);

  const flush = useCallback(async () => {
    if (flushingRef.current) return;
    flushingRef.current = true;
    setIsFlushing(true);

    const current = await AsyncStorage.getItem(QUEUE_KEY);
    let items: QueuedAction[] = current ? JSON.parse(current) : [];
    const remaining: QueuedAction[] = [];

    for (const item of items) {
      try {
        if (item.type === "pod_submit") {
          await api.post(`/api/jobs/${item.jobId}/pod`, item.payload);
        } else if (item.type === "status_update") {
          await api.patch(`/api/jobs/${item.jobId}`, item.payload);
        }
      } catch (err: any) {
        remaining.push({
          ...item,
          retries: item.retries + 1,
          lastError: err.message ?? "Unknown error",
        });
      }
    }

    setQueue(remaining);
    await persistQueue(remaining);
    setIsFlushing(false);
    flushingRef.current = false;
  }, []);

  useEffect(() => {
    if (isOnline && queue.length > 0 && !flushingRef.current) {
      flush();
    }
  }, [isOnline, queue.length, flush]);

  const value = useMemo(
    () => ({ isOnline, queue, pendingCount: queue.length, isFlushing, enqueue, flush }),
    [isOnline, queue, isFlushing, enqueue, flush],
  );

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
}

export function useOffline() {
  return useContext(OfflineContext);
}
