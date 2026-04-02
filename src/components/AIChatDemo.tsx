import React, { useState } from 'react';
import { useAIChat } from '../hooks/useAIChat';

export const AIChatDemo: React.FC = () => {
  const { messages, loading, error, sendMessage, clearHistory } = useAIChat();
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const message = input;
    setInput('');
    
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '2rem auto', 
      padding: '1rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h2 style={{ marginBottom: '1rem' }}>AI Chat Demo</h2>

      {/* Messages Container */}
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '1rem',
        minHeight: '300px',
        maxHeight: '500px',
        overflowY: 'auto',
        backgroundColor: '#f9fafb',
        marginBottom: '1rem'
      }}>
        {messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>
            Start a conversation by typing a message below!
          </p>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                borderRadius: '8px',
                backgroundColor: msg.role === 'user' ? '#dbeafe' : '#ffffff',
                border: msg.role === 'user' ? 'none' : '1px solid #e5e7eb',
                marginLeft: msg.role === 'user' ? '1rem' : '0',
                marginRight: msg.role === 'assistant' ? '1rem' : '0',
              }}
            >
              <div style={{ 
                fontWeight: 600, 
                fontSize: '0.75rem', 
                color: msg.role === 'user' ? '#1e40af' : '#374151',
                marginBottom: '0.25rem',
                textTransform: 'uppercase'
              }}>
                {msg.role}
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {msg.content}
              </div>
              <div style={{ 
                fontSize: '0.7rem', 
                color: '#9ca3af', 
                marginTop: '0.5rem',
                textAlign: 'right'
              }}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            marginTop: '1rem',
            textAlign: 'center',
            color: '#92400e'
          }}>
            AI is thinking...
          </div>
        )}

        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fee2e2',
            borderRadius: '8px',
            marginTop: '1rem',
            color: '#991b1b'
          }}>
            Error: {error.message}
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: loading || !input.trim() ? '#9ca3af' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>

        <button
          type="button"
          onClick={clearHistory}
          disabled={messages.length === 0}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            color: '#6b7280',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.875rem',
            cursor: messages.length === 0 ? 'not-allowed' : 'pointer',
            opacity: messages.length === 0 ? 0.5 : 1,
          }}
        >
          Clear Conversation
        </button>
      </form>

      {/* Info */}
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        backgroundColor: '#eff6ff',
        borderRadius: '6px',
        fontSize: '0.875rem',
        color: '#1e40af',
        border: '1px solid #bfdbfe'
      }}>
        <strong>Demo Mode:</strong> Without an API key, responses are simulated. 
        Add <code>VITE_GEMINI_API_KEY</code> to your .env file for real AI responses.
      </div>
    </div>
  );
};

export default AIChatDemo;
