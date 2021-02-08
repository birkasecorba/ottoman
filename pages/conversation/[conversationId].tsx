// React & NextJS
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

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

  function sendMessage(e) {
    e.preventDefault();

    socket.emit('conversation.message', {
      conversationId,
      message,
    });
  }

  return (
    <div>
      <div>
        {`Conversation Id: ${conversation._id}`}
      </div>

      <div>
        {`Prompt: ${conversation.prompt}`}
      </div>

      <div>
        {`Users: ${conversation.users.map((user) => user.name).join(', ')}`}
      </div>

      <ul>
        {conversation.messages.map((m) => (
          <li key={m._id}>
            {m.value}
            <div>
              -
              {' '}
              {m.user.name}
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={sendMessage}>
        <input value={message} onChange={(e) => setMessage(e.target.value)} />
        <button type="submit">Send</button>
      </form>

    </div>
  );
}
