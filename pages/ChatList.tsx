
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { MessageSquare, Clock, ArrowRight, Check, CheckCheck } from 'lucide-react';

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

  useEffect(() => {
    if (!auth.currentUser) return;

    // Listen to chats where user is a participant
    const unsubscribe = db.collection('chats')
      .where('participants', 'array-contains', auth.currentUser.uid)
      .orderBy('lastMessageTimestamp', 'desc')
      .onSnapshot((snapshot) => {
        const rooms: ChatRoom[] = [];
        snapshot.forEach(doc => {
          rooms.push({ id: doc.id, ...doc.data() } as ChatRoom);
        });
        setChats(rooms);
        setLoading(false);
      }, (error) => {
         console.error("Error fetching chats:", error);
         setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const formatTime = (timestamp: any) => {
      if (!timestamp) return '';
      const date = timestamp.toDate();
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading) {
     return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
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

        {chats.length === 0 ? (
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
               <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                   <MessageSquare className="text-gray-300" size={32} />
               </div>
               <h3 className="text-lg font-bold text-gray-900">No chats yet</h3>
               <p className="text-gray-500 mt-2 text-sm">When you chat with owners, they'll appear here.</p>
               <Link to="/" className="mt-6 inline-block bg-brand-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-brand-700 transition-all">
                   Find Properties
               </Link>
           </div>
        ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {chats.map((chat) => (
                    <Link 
                        key={chat.id} 
                        to={`/chat/${chat.id}`}
                        className="block p-4 hover:bg-gray-50 transition-colors group"
                    >
                        <div className="flex gap-4 items-center">
                             <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-lg border border-brand-100 flex-shrink-0">
                                 {chat.propertyTitle?.charAt(0) || 'P'}
                             </div>
                             
                             <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="text-sm font-bold text-gray-900 truncate pr-2">
                                        {chat.propertyTitle || "Property Inquiry"}
                                    </h3>
                                    <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">
                                        {formatTime(chat.lastMessageTimestamp)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {chat.lastSenderId === auth.currentUser?.uid && (
                                        <Check size={14} className="text-gray-400 flex-shrink-0" />
                                    )}
                                    <p className="text-xs text-gray-500 truncate">
                                        {chat.lastMessage || <span className="italic opacity-60">Tap to start chatting</span>}
                                    </p>
                                </div>
                             </div>
                             
                             <ArrowRight size={16} className="text-gray-200 group-hover:text-brand-400 transition-colors" />
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
