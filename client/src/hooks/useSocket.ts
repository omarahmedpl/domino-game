import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

let socketInstance: Socket | null = null;

export function useSocket() {
  const { token, user, updateId } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    if (!socketInstance) {
      socketInstance = io('/', {
        auth: token
          ? { token }
          : { username: user.username },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Sync server-assigned userId (critical for guests)
      socketInstance.on('identity', (data: { userId: string }) => {
        if (data?.userId) updateId(data.userId);
      });
    }

    socketRef.current = socketInstance;

    return () => {
      // Don't disconnect on unmount — keep singleton alive
    };
  }, [token, user, updateId]);

  const emit = useCallback((event: string, data?: unknown) => {
    socketInstance?.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketInstance?.on(event, handler);
    return () => {
      socketInstance?.off(event, handler);
    };
  }, []);

  const off = useCallback((event: string, handler?: (...args: unknown[]) => void) => {
    socketInstance?.off(event, handler);
  }, []);

  return { socket: socketRef.current, emit, on, off };
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
