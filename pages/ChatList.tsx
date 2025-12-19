
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { MessageSquare, Clock, ArrowRight, Check, CheckCheck, Loader2 } from 'lucide-react';

interface ChatRoom {
  id: string;
  participants: string[];
  propertyTitle?: string;
  lastMessage?: string;
  lastMessageTimestamp?: any;
  lastSenderId?: string;
}

const ChatList: React.FC = () => {
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fixed query: removed orderBy to avoid missing index errors. 
    // We will sort in-memory instead for maximum reliability.
    const unsubscribe = db.collection('chats')
      .where('participants', 'array-contains', auth.currentUser.uid)
      .onSnapshot((snapshot) => {
        const rooms: ChatRoom[] = [];
        snapshot.forEach(doc => {
          rooms.push({ id: doc.id, ...doc.data() } as ChatRoom);
        });

        // IN-MEMORY SORT BY TIMESTAMP
        rooms.sort((a, b) => {
            const timeA = a.lastMessageTimestamp?.toMillis ? a.lastMessageTimestamp.toMillis() : 0;
            const timeB = b.lastMessageTimestamp?.toMillis ? b.lastMessageTimestamp.toMillis() : 0;
            return timeB - timeA;
        });

        setChats(rooms);
        setLoading(false);
      }, (err) => {
         console.error("Chat fetch error:", err);
         setError("Failed to load your chats. Check your connection.");
         setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const formatTime = (timestamp: any) => {
      if (!timestamp) return '';
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading) {
     return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Loader2 className="animate-spin text-brand-500" size={32} />
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MessageSquare className="text-brand-600" size={24} /> 
            Messages
        </h1>

        {error ? (
           <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
               <p className="text-red-500 font-medium mb-4">{error}</p>
               <button onClick={() => window.location.reload()} className="bg-brand-600 text-white px-6 py-2 rounded-xl font-bold">Retry</button>
           </div>
        ) : chats.length === 0 ? (
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
               <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                   <MessageSquare size={32} />
               </div>
               <h3 className="text-lg font-bold text-gray-900">No conversations</h3>
               <p className="text-gray-500 mt-2 text-sm">Find a property and contact the owner to start chatting.</p>
               <Link to="/" className="mt-6 inline-block bg-brand-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100">
                   Browse Properties
               </Link>
           </div>
        ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {chats.map((chat) => (
                    <Link 
                        key={chat.id} 
                        to={`/chat/${chat.id}`}
                        className="block p-5 hover:bg-gray-50 transition-colors group"
                    >
                        <div className="flex gap-4 items-center">
                             <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-xl border border-brand-100 flex-shrink-0">
                                 {chat.propertyTitle?.charAt(0) || 'P'}
                             </div>
                             
                             <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="text-sm font-black text-gray-900 truncate pr-2">
                                        {chat.propertyTitle || "Property Inquiry"}
                                    </h3>
                                    <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap uppercase tracking-tighter">
                                        {formatTime(chat.lastMessageTimestamp)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {chat.lastSenderId === auth.currentUser?.uid && (
                                        <Check size={14} className="text-brand-500 flex-shrink-0" />
                                    )}
                                    <p className="text-xs text-gray-500 truncate font-medium">
                                        {chat.lastMessage || <span className="italic opacity-60">Start a conversation...</span>}
                                    </p>
                                </div>
                             </div>
                             
                             <div className="bg-gray-50 p-2 rounded-full text-gray-300 group-hover:text-brand-500 group-hover:bg-brand-50 transition-all">
                                <ArrowRight size={16} />
                             </div>
                        </div>
                    </Link>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
