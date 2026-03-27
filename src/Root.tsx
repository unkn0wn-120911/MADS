import { useEffect } from 'react';
import { useChat } from './hooks/useChat';
import App from './App';

// This is a wrapper to handle any global initialization if needed
export default function Root() {
  return <App />;
}
