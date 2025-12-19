
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import firebase from 'firebase/compat/app';
import { Send, ArrowLeft, Loader2, Check, CheckCheck, ShieldAlert } from 'lucide-react';

interface Message {
    id: string;
    senderId: string;
    message: string;
    timestamp: any;
    status: 'sent' | 'read';
}

const ChatScreen: React.FC = () => {
    const { chatId } = useParams<{ chatId: string }>();
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [propertyTitle, setPropertyTitle] = useState('');

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        if (!chatId || !auth.currentUser) return;

        // 1. Fetch Chat Metadata
        db.collection('chats').doc(chatId).get().then(doc => {
            if(doc.exists) {
                setPropertyTitle(doc.data()?.propertyTitle || 'Chat');
            }
        }).catch(err => console.error("Metadata fetch error:", err));

        // 2. Listen for Messages
        const unsubscribe = db.collection('chats')
            .doc(chatId)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .onSnapshot(snapshot => {
                const msgs: Message[] = [];
                const unreadMessagesBatch = db.batch();
                let hasUnread = false;

                snapshot.forEach(doc => {
                    const data = doc.data() as Message;
                    msgs.push({ id: doc.id, ...data });

                    // 3. Mark incoming messages from OTHER as READ
                    if (data.senderId !== auth.currentUser?.uid && data.status === 'sent') {
                        unreadMessagesBatch.update(doc.ref, { status: 'read' });
                        hasUnread = true;
                    }
                });

                if (hasUnread) {
                    unreadMessagesBatch.commit().catch(err => console.error("Read Receipt Error:", err));
                }

                setMessages(msgs);
                setLoading(false);
                setError(null);
                setTimeout(() => scrollToBottom(msgs.length < 15 ? "auto" : "smooth"), 100);
            }, (err) => {
                console.error("Chat Listener Error:", err);
                setError(err.message.includes("permission-denied") ? "You don't have permission to view this chat." : "Failed to load messages.");
                setLoading(false);
            });

        return () => unsubscribe();
    }, [chatId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatId || !auth.currentUser) return;

        const msgText = newMessage.trim();
        setNewMessage(''); 

        try {
            const batch = db.batch();
            const msgRef = db.collection('chats').doc(chatId).collection('messages').doc();
            
            batch.set(msgRef, {
                senderId: auth.currentUser.uid,
                message: msgText,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'sent'
            });

            batch.update(db.collection('chats').doc(chatId), {
                lastMessage: msgText,
                lastMessageTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
                lastSenderId: auth.currentUser.uid
            });

            await batch.commit();
            scrollToBottom();
        } catch (err) {
            console.error("Send error:", err);
            setError("Failed to send message. Check your connection.");
        }
    };

    const formatTime = (ts: any) => {
        if (!ts) return 'Sending...';
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] bg-[#e5ddd5] relative">
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"></div>

            <div className="bg-white p-3 shadow-sm border-b border-gray-200 flex items-center gap-3 z-10">
                <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900 p-1">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold">
                        {propertyTitle.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-800 leading-tight truncate max-w-[180px]">{propertyTitle}</h2>
                        <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Online</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 z-10">
                {loading ? (
                    <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-brand-500" /></div>
                ) : error ? (
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-3 text-red-700 text-sm">
                        <ShieldAlert size={20} /> {error}
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex justify-center"><span className="bg-white/80 px-4 py-1.5 rounded-full text-xs text-gray-500 shadow-sm border border-gray-100">Start the conversation...</span></div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.senderId === auth.currentUser?.uid;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-3 py-1.5 rounded-lg shadow-sm relative ${isMe ? 'bg-[#dcf8c6] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap pr-10">{msg.message}</p>
                                    <div className="flex items-center justify-end gap-1 mt-1">
                                        <span className="text-[9px] text-gray-500">{formatTime(msg.timestamp)}</span>
                                        {isMe && (
                                            msg.status === 'read' 
                                            ? <CheckCheck size={14} className="text-blue-500" /> 
                                            : <Check size={14} className="text-gray-400" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="bg-[#f0f0f0] p-3 flex items-center gap-2 z-10">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-white rounded-full px-5 py-3 text-sm focus:outline-none shadow-sm"
                />
                <button type="submit" disabled={!newMessage.trim()} className="bg-brand-600 text-white p-3 rounded-full shadow-md disabled:opacity-50 active:scale-95 transition-transform">
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default ChatScreen;
