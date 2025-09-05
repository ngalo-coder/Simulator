import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { ApiError, Session } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

interface Message {
  role: 'Clinician' | 'Patient' | 'System';
  content: string;
}

const SimulationChatPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const start = async () => {
      if (!caseId) return;
      try {
        const { sessionId } = await api.startSimulation(caseId);
        // This is a simplified session object. 
        // In a real app, you might fetch the full session details.
        setSession({ _id: sessionId, case_ref: caseId, user: '', history: [], sessionEnded: false });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to start simulation');
      } finally {
        setLoading(false);
      }
    };
    start();
  }, [caseId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !session) return;

    const userMessage: Message = { role: 'Clinician', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    let patientResponse = '';
    api.streamSimulationAsk(
      session._id,
      input,
      (chunk) => {
        patientResponse += chunk;
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.role === 'Patient') {
            return [...prev.slice(0, -1), { ...lastMessage, content: patientResponse }];
          }
          return [...prev, { role: 'Patient', content: patientResponse }];
        });
      },
      () => {},
      (err) => setError(err.message)
    );
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'Clinician' ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-lg px-4 py-2 ${msg.role === 'Clinician' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 px-4 py-2 border rounded-l-lg"
          placeholder="Type your message..."
        />
        <button onClick={handleSend} className="px-4 py-2 bg-blue-500 text-white rounded-r-lg">
          Send
        </button>
      </div>
    </div>
  );
};

export default SimulationChatPage;