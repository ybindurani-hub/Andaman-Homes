
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import firebase from 'firebase/compat/app';
import { Send, ArrowLeft, Loader2, Check, CheckCheck } from 'lucide-react';

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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [propertyTitle, setPropertyTitle] = useState('');
    const [otherUserId, setOtherUserId] = useState<string | null>(null);

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        if (!chatId || !auth.currentUser) return;

        // 1. Fetch Chat Metadata and determine the "Other Person"
        db.collection('chats').doc(chatId).get().then(doc => {
            if(doc.exists) {
                const data = doc.data();
                setPropertyTitle(data?.propertyTitle || 'Chat');
                const participants = data?.participants || [];
                const other = participants.find((id: string) => id !== auth.currentUser?.uid);
                setOtherUserId(other || null);
            }
        });

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
                    unreadMessagesBatch.commit().catch(err => console.error("Error marking read:", err));
                }

                setMessages(msgs);
                setLoading(false);
                // Instant scroll on first load, smooth thereafter
                setTimeout(() => scrollToBottom(messages.length === 0 ? "auto" : "smooth"), 100);
            }, (error) => {
                console.error("Chat Listener Error:", error);
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
            
            // 1. Add Message with 'sent' status
            const msgRef = db.collection('chats').doc(chatId).collection('messages').doc();
            batch.set(msgRef, {
                senderId: auth.currentUser.uid,
                message: msgText,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'sent'
            });

            // 2. Update Chat Metadata for the List view
            const chatRef = db.collection('chats').doc(chatId);
            batch.update(chatRef, {
                lastMessage: msgText,
                lastMessageTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
                lastSenderId: auth.currentUser.uid
            });

            await batch.commit();
            scrollToBottom();
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const renderTicks = (msg: Message) => {
        if (msg.senderId !== auth.currentUser?.uid) return null;
        
        if (msg.status === 'read') {
            return <CheckCheck size={14} className="text-blue-400 inline ml-1 mb-0.5" />;
        }
        return <Check size={14} className="text-gray-400 inline ml-1 mb-0.5" />;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] bg-[#e5ddd5] relative">
            {/* Background Pattern overlay (WhatsApp Style) */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"></div>

            {/* Header */}
            <div className="bg-white p-3 shadow-sm border-b border-gray-200 flex items-center gap-3 z-10">
                <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900 p-1">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                        {propertyTitle.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-800 leading-tight truncate max-w-[200px]">
                            {propertyTitle}
                        </h2>
                        <p className="text-[10px] text-gray-500 uppercase font-medium">Property Inquiry</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 z-10">
                {loading ? (
                    <div className="flex justify-center pt-10">
                        <Loader2 className="animate-spin text-brand-500" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex justify-center">
                        <div className="bg-brand-50 text-brand-800 px-4 py-2 rounded-lg text-xs font-medium shadow-sm border border-brand-100">
                            Messages are end-to-end secure. Start chatting!
                        </div>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.senderId === auth.currentUser?.uid;
                        const showDate = index === 0 || (msg.timestamp && messages[index-1].timestamp && 
                                        new Date(msg.timestamp.toDate()).toDateString() !== new Date(messages[index-1].timestamp.toDate()).toDateString());

                        return (
                            <React.Fragment key={msg.id}>
                                {showDate && msg.timestamp && (
                                    <div className="flex justify-center my-4">
                                        <span className="bg-white/80 px-3 py-1 rounded-md text-[10px] text-gray-500 font-bold shadow-sm uppercase">
                                            {new Date(msg.timestamp.toDate()).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                )}
                                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div 
                                        className={`max-w-[85%] px-3 py-1.5 rounded-lg text-sm shadow-sm relative group ${
                                            isMe 
                                            ? 'bg-[#dcf8c6] text-gray-800 rounded-tr-none' 
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                        }`}
                                    >
                                        <p className="leading-normal break-words pr-12">{msg.message}</p>
                                        <div className="flex items-center justify-end gap-1 mt-0.5 -mr-1">
                                            <span className={`text-[9px] ${isMe ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                                            </span>
                                            {renderTicks(msg)}
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="bg-[#f0f0f0] p-2 flex items-center gap-2 z-10 border-t border-gray-200">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
                />
                <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="bg-brand-600 hover:bg-brand-700 text-white p-2.5 rounded-full shadow-md disabled:opacity-50 transition-all active:scale-90"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default ChatScreen;
