import { useEffect, useState } from 'react';

interface LiveAnnouncerProps {
  message: string;
  politeness?: 'polite' | 'assertive';
  clearAfter?: number;
}

// Global announcer for app-wide announcements
let globalAnnounce: ((message: string, politeness?: 'polite' | 'assertive') => void) | null = null;

export function setGlobalAnnouncer(announce: (message: string, politeness?: 'polite' | 'assertive') => void) {
  globalAnnounce = announce;
}

export function announce(message: string, politeness: 'polite' | 'assertive' = 'polite') {
  if (globalAnnounce) {
    globalAnnounce(message, politeness);
  }
}

// Component for single announcements
export function LiveAnnouncer({ message, politeness = 'polite', clearAfter = 1000 }: LiveAnnouncerProps) {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    setCurrentMessage(message);
    const timer = setTimeout(() => {
      setCurrentMessage('');
    }, clearAfter);

    return () => clearTimeout(timer);
  }, [message, clearAfter]);

  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {currentMessage}
    </div>
  );
}

// Permanent announcer regions for the app
export function AnnouncerRegions() {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  useEffect(() => {
    setGlobalAnnouncer((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
      if (politeness === 'assertive') {
        setAssertiveMessage(message);
        setTimeout(() => setAssertiveMessage(''), 1000);
      } else {
        setPoliteMessage(message);
        setTimeout(() => setPoliteMessage(''), 1000);
      }
    });

    return () => {
      globalAnnounce = null;
    };
  }, []);

  return (
    <>
      {/* Polite announcements - won't interrupt */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {politeMessage}
      </div>
      
      {/* Assertive announcements - will interrupt */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
      >
        {assertiveMessage}
      </div>
    </>
  );
}
