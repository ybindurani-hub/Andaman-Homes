
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { MessageSquare, Clock, ArrowRight } from 'lucide-react';

interface ChatRoom {
  id: string;
  participants: string[];
  propertyTitle?: string;
  lastMessage?: string;
  lastMessageTimestamp?: any;
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

  if (loading) {
     return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MessageSquare className="text-brand-600" /> Your Messages
        </h1>

        {chats.length === 0 ? (
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
               <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                   <MessageSquare className="text-gray-400" size={32} />
               </div>
               <h3 className="text-lg font-medium text-gray-900">No messages yet</h3>
               <p className="text-gray-500 mt-2">Start a conversation with a property owner to see it here.</p>
               <Link to="/" className="mt-6 inline-block bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-700">
                   Browse Properties
               </Link>
           </div>
        ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {chats.map((chat) => (
                    <Link 
                        key={chat.id} 
                        to={`/chat/${chat.id}`}
                        className="block p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-none"
                    >
                        <div className="flex justify-between items-start">
                             <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-gray-900 truncate">
                                    {chat.propertyTitle || "Property Inquiry"}
                                </h3>
                                <p className="text-sm text-gray-600 truncate mt-1">
                                    {chat.lastMessage || <span className="italic text-gray-400">No messages yet</span>}
                                </p>
                             </div>
                             <div className="ml-4 flex flex-col items-end flex-shrink-0">
                                <ArrowRight size={16} className="text-gray-300 mb-2" />
                                {chat.lastMessageTimestamp && (
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock size={10} />
                                        {new Date(chat.lastMessageTimestamp?.toDate()).toLocaleDateString()}
                                    </span>
                                )}
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
