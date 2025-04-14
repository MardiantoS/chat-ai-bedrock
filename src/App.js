import React, { useState, useRef, useEffect } from 'react';
import { post } from 'aws-amplify/api';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth'});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message to conversation
    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    
    try {
      // Using Amplify v6 post method with .response
      const { body } = await post({
        apiName: 'bedrockAPI',
        path: '/chat',
        options: {
          body: { 
            messages: updatedMessages 
          }
        }
      }).response;
      
      // Parse the response data
      const responseData = await body.json();
      
      // Add assistant response to conversation
      if (responseData.content && responseData.content[0] && responseData.content[0].text) {
        const assistantMessage = { 
          role: 'assistant', 
          content: responseData.content[0].text 
        };
        setMessages([...updatedMessages, assistantMessage]);
      }
    } catch (error) {
      console.error('Error calling API:', error);
      // Add error message to conversation
      setMessages([
        ...updatedMessages, 
        { 
          role: 'assistant', 
          content: `Error: ${error.message}` 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Claude AI Chat with Amazon Bedrock</h1>
      </header>
      
      <div className="chat-container">
        <div className="conversation">
          {messages.length === 0 ? (
            <p className="empty-state">Start a conversation with Claude AI</p>
          ) : (
            messages.map((message, index) => (
              <div 
                key={index} 
                className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
              >
                <div className="message-role">{message.role === 'user' ? 'You' : 'Claude'}</div>
                <div className="message-content">{message.content}</div>
              </div>
            ))
          )}
          {loading && (
            <div className="message assistant-message">
              <div className="message-role">Claude</div>
              <div className="message-content loading">Thinking...</div>
            </div>
          )}
          <div ref={messagesEndRef} /> {/* This element is used for auto-scrolling */}
        </div>
        
        <form onSubmit={handleSubmit} className="input-form">
          <div className="input-container">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              rows={3}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;