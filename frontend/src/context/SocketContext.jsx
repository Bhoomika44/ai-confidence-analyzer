import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected with ID:', newSocket.id);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinPresentationRoom = (presentationId) => {
    if (socket && presentationId) {
      socket.emit('join_presentation', presentationId);
    }
  };

  const joinPracticeRoom = (weakSectionId) => {
    if (socket && weakSectionId) {
      socket.emit('join_practice', weakSectionId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, joinPresentationRoom, joinPracticeRoom }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
