import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
    const newSocket = io(API_BASE_URL, {
      transports: ['websocket'],
      upgrade: false,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      
      // Join appropriate rooms based on user role
      if (user.role === 'hospital_staff' && user.linkedHospitalId) {
        newSocket.emit('joinHospitalRoom', user.linkedHospitalId);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user?.id]);

  const joinHospitalRoom = (hospitalId) => {
    if (socket && connected) {
      socket.emit('joinHospitalRoom', hospitalId);
    }
  };

  const joinIncidentRoom = (incidentId) => {
    if (socket && connected) {
      socket.emit('joinIncidentRoom', incidentId);
    }
  };

  const value = {
    socket,
    connected,
    joinHospitalRoom,
    joinIncidentRoom,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};