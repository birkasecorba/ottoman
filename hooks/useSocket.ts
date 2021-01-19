import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import * as SocketIOClient from 'socket.io-client';

const socket = io();

export default function useSocket(cb?: (s: SocketIOClient.Socket) => void) {
  const [activeSocket, setActiveSocket] = useState(null);

  useEffect(() => {
    if (activeSocket || !socket) return;

    if (cb) {
      cb(socket);
    }
    setActiveSocket(socket);

    // eslint-disable-next-line consistent-return
    return () => {
      socket.off('message.chat1');
    };
  }, [socket]);

  return activeSocket;
}
