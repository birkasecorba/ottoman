// React & NextJS
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

import useSocket from '../../hooks/useSocket';

// type Conversation = {
//   id: string,
//   users: [User],
//   messages: [Message],
//   prompt: Prompt
// }

export default function ConversationPage() {
  const socket = useSocket();
  const router = useRouter();
  const userId = Cookies.get('userId');
  const [conversation, setConversation] = useState(null);
  const [message, setMessage] = useState('');

  const { conversationId } = router.query;

  useEffect(() => {
    if (!socket || !conversationId) {
      return;
    }

    socket.emit('conversation.join', { conversationId });
  }, [socket, conversationId]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on('conversation.info', (c) => {
      console.log('conversation.info', c);
      setConversation(c);
    });
  }, [socket]);

  if (!conversation) {
    return <div>Loading</div>;
  }

  const match = conversation.users.find((user) => user._id !== userId);

  function sendMessage(e) {
    e.preventDefault();

    socket.emit('conversation.message', {
      conversationId,
      message,
    });
    setMessage('');
  }

  function onEnterPress(e) {
    if (e.keyCode === 13 && e.shiftKey === false) {
      sendMessage(e);
    }
  }

  return (
    <>
      <div style={{ overscrollBehavior: 'none' }}>

        <div
          className="fixed w-full bg-green-400 h-16 pt-2 text-white flex justify-between shadow-md"
          style={{ top: '0px', overscrollBehavior: 'none' }}
        >
          {/* <div>
            {`Prompt: ${conversation.prompt}`}
          </div> */}

          <a href="#">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-12 h-12 my-1 text-green-100 ml-2"
            >
              <path
                className="text-green-100 fill-current"
                d="M9.41 11H17a1 1 0 0 1 0 2H9.41l2.3 2.3a1 1 0 1 1-1.42 1.4l-4-4a1 1 0 0 1 0-1.4l4-4a1 1 0 0 1 1.42 1.4L9.4 11z"
              />
            </svg>
          </a>
          <div className="my-3 text-green-100 font-bold text-lg tracking-wide">{match.name}</div>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="icon-dots-vertical w-8 h-8 mt-2 mr-2"
          >
            <path
              className="text-green-100 fill-current"
              fillRule="evenodd"
              d="M12 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"
            />
          </svg>
        </div>

        <div className="mt-20 mb-16">

          <ul>
            {conversation.messages.map((m) => (
              <div className="clearfix" key={m._id}>
                <div
                  className={`bg-gray-300 w-3/4 mx-4 my-2 p-2 rounded-lg ${userId === m.user._id && 'bg-green-300 float-right'}`}
                >
                  {m.value}
                </div>
              </div>

            ))}
          </ul>
        </div>
      </div>

      <form
        onSubmit={sendMessage}
        className="fixed w-full flex justify-between bg-green-100"
        style={{ bottom: '0px' }}
      >
        <textarea
          className="flex-grow m-2 py-2 px-4 mr-1 rounded-full border border-gray-300 bg-gray-200 resize-none"
          rows={1}
          placeholder="Message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={onEnterPress}
        />

        <button type="submit" className="m-2">
          <svg
            className="svg-inline--fa text-green-400 fa-paper-plane fa-w-16 w-12 h-12 py-2 mr-2"
            aria-hidden="true"
            focusable="false"
            data-prefix="fas"
            data-icon="paper-plane"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
          >
            <path
              fill="currentColor"
              d="M476 3.2L12.5 270.6c-18.1 10.4-15.8 35.6 2.2 43.2L121 358.4l287.3-253.2c5.5-4.9 13.3 2.6 8.6 8.3L176 407v80.5c0 23.6 28.5 32.9 42.5 15.8L282 426l124.6 52.2c14.2 6 30.4-2.9 33-18.2l72-432C515 7.8 493.3-6.8 476 3.2z"
            />
          </svg>
        </button>
      </form>
    </>
  );
}
