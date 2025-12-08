
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import firebase from 'firebase/compat/app';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';

interface Message {
    id: string;
    senderId: string;
    message: string;
    timestamp: any;
}

const ChatScreen: React.FC = () => {
    const { chatId } = useParams<{ chatId: string }>();
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [propertyTitle, setPropertyTitle] = useState('');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!chatId || !auth.currentUser) return;

        // Fetch Chat Metadata (Title)
        db.collection('chats').doc(chatId).get().then(doc => {
            if(doc.exists) {
                setPropertyTitle(doc.data()?.propertyTitle || 'Chat');
            }
        });

        // Listen for Messages
        const unsubscribe = db.collection('chats')
            .doc(chatId)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .onSnapshot(snapshot => {
                const msgs: Message[] = [];
                snapshot.forEach(doc => {
                    msgs.push({ id: doc.id, ...doc.data() } as Message);
                });
                setMessages(msgs);
                setLoading(false);
                setTimeout(scrollToBottom, 100);
            });

        return () => unsubscribe();
    }, [chatId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatId || !auth.currentUser) return;

        const msgText = newMessage.trim();
        setNewMessage(''); // Clear input immediately

        try {
            const batch = db.batch();
            
            // 1. Add Message
            const msgRef = db.collection('chats').doc(chatId).collection('messages').doc();
            batch.set(msgRef, {
                senderId: auth.currentUser.uid,
                message: msgText,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // 2. Update Chat Metadata
            const chatRef = db.collection('chats').doc(chatId);
            batch.update(chatRef, {
                lastMessage: msgText,
                lastMessageTimestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            await batch.commit();
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message");
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-100">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm border-b border-gray-200 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-lg font-bold text-gray-800 leading-tight">
                        {propertyTitle || 'Conversation'}
                    </h2>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <div className="flex justify-center pt-10">
                        <Loader2 className="animate-spin text-brand-500" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10 text-sm">
                        Start the conversation...
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === auth.currentUser?.uid;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div 
                                    className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                                        isMe 
                                        ? 'bg-brand-600 text-white rounded-br-none' 
                                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                    }`}
                                >
                                    {msg.message}
                                    <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-brand-200' : 'text-gray-400'}`}>
                                        {msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="bg-white p-3 border-t border-gray-200 flex items-center gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none"
                />
                <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="bg-brand-600 hover:bg-brand-700 text-white p-3 rounded-full shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default ChatScreen;
