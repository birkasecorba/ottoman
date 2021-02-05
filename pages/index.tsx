// React & NextJS
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import Cookies from 'js-cookie';
// import { v4 as uuidv4 } from 'uuid';
import useSocket from '../hooks/useSocket';
import useInput from '../hooks/useInput';
import Input from '../components/Input';
// import styles from '../styles/Home.module.css';

// Constants
const SCREENS = {
  HOME: 'home',
  CONVERSATION: 'conversation',
  POST_CONVERSATION: 'post_conversation',
  // ? not sure about if this is a page
  REPORT: 'report',
  // LOBBY: 'lobby',
  // FILL_QUESTIONS: 'fill_questions',
  // VOTE_WORDS: 'vote_words',
  // SEE_RESPONSES: 'see_responses',
  // SCOREBOARD: 'scoreboard',
};

async function postData(url = '', data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json',
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

export default function Home() {
  const socket = useSocket();
  const { value: name, bind } = useInput('');
  const router = useRouter();

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on('conversation.search', (conversation) => {
      if (conversation._id) {
        router.push(`/conversation/${conversation._id}`);
      }
    });

    socket.on('setCookie', (cookies) => {
      Object.entries(cookies).forEach(([key, value]) => {
        Cookies.set(key, value);
      });
    });
  });

  function startConversation(e) {
    e.preventDefault();
    socket.emit('conversation.search', { name });
  }

  return (
    <div>
      <h1>Discussions Over Coffee</h1>
      <div>[Maybe a small explanaiton]</div>
      <h2>
        Grab your self a cup of [Rotating coffee names and images]
        <br />
        and when you are ready, start a conversation with someone random.
        We&apos;ll provide the prompt
      </h2>

      <form onSubmit={startConversation}>
        <Input label="Username" {...bind} />
        <button type="submit">Start Conversation</button>
      </form>
    </div>
  );
}
