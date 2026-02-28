
import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { 
  Coffee, ShieldCheck, RefreshCw, XCircle, CheckCircle, 
  LogOut, QrCode, Utensils, Info, Pencil, Trash2, Save, 
  X, Plus, AlertTriangle, Sparkles, MessageSquare, UploadCloud, Image as ImageIcon,
  Send
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { MenuItem, CategoryKey, AdminView, NewItemData } from './types';
import { INITIAL_MENU, CATEGORIES, DEFAULT_ICONS, ADMIN_PIN } from './constants';
import { initAIChat, sendChatMessage } from './geminiService';

const MENU_COLLECTION = 'menu_items';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function App() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [activeAdminView, setActiveAdminView] = useState<AdminView>(AdminView.NONE);
  const [pinInput, setPinInput] = useState('');
  
  // Edit/Add states
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [addingToCategory, setAddingToCategory] = useState<CategoryKey | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [newItemData, setNewItemData] = useState<NewItemData>({ name: '', price: '', description: '', image: '', category: 'drinks' });

  // AI Assistant state
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [aiMood, setAiMood] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUploadSuccess(false);
  }, [editingItem, addingToCategory]);

  useEffect(() => {
    if (isAIChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAIChatOpen, isAILoading]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(false);
    try {
      const storageRef = ref(storage, `menu_images/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      if (isEditing && editingItem) {
        setEditingItem({ ...editingItem, image: downloadURL });
      } else {
        setNewItemData({ ...newItemData, image: downloadURL });
      }
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("שגיאה בהעלאת התמונה");
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  // Initial Data Load & Subscription
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, MENU_COLLECTION), (snapshot) => {
      const items: MenuItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MenuItem));
      
      setMenuItems(items);
      
      // If DB is empty, seed it with initial data
      if (items.length === 0 && !snapshot.metadata.fromCache) {
        seedDatabase();
      } else {
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching menu:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const seedDatabase = async () => {
    try {
      const batch = writeBatch(db);
      INITIAL_MENU.forEach((item) => {
        const docRef = doc(db, MENU_COLLECTION, item.id);
        batch.set(docRef, item);
      });
      await batch.commit();
      console.log("Database seeded successfully");
    } catch (e) {
      console.error("Error seeding database:", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    if (!isAdminMode) return;
    try {
      const itemRef = doc(db, MENU_COLLECTION, item.id);
      await updateDoc(itemRef, { available: !item.available });
    } catch (e) {
      console.error("Error updating availability:", e);
      alert("שגיאה בעדכון זמינות");
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAdminMode(true);
      setActiveAdminView(AdminView.NONE);
      setPinInput('');
    } else {
      alert("סיסמה שגויה");
      setPinInput('');
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    try {
      await setDoc(doc(db, MENU_COLLECTION, editingItem.id), editingItem);
      setEditingItem(null);
      setActiveAdminView(AdminView.NONE);
    } catch (e) {
      console.error("Error saving item:", e);
      alert("שגיאה בשמירת הפריט");
    }
  };

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `item_${Date.now()}`;
    const newItem: MenuItem = {
      ...newItemData,
      id: newId,
      available: true
    };

    try {
      await setDoc(doc(db, MENU_COLLECTION, newId), newItem);
      setAddingToCategory(null);
      setActiveAdminView(AdminView.NONE);
      setNewItemData({ name: '', price: '', description: '', image: '', category: 'drinks' });
    } catch (e) {
      console.error("Error adding item:", e);
      alert("שגיאה בהוספת פריט");
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDoc(doc(db, MENU_COLLECTION, itemToDelete.id));
      setItemToDelete(null);
      setActiveAdminView(AdminView.NONE);
    } catch (e) {
      console.error("Error deleting item:", e);
      alert("שגיאה במחיקת הפריט");
    }
  };

  const handleOpenChat = () => {
    initAIChat(menuItems);
    setChatMessages([{ 
      role: 'assistant', 
      content: 'היי! אני הבריסטה הדיגיטלי של אינדיגו. מה מתחשק לכם היום?\nספרו לי איך אתם מרגישים ואמליץ לכם על הזיווג המושלם ☕✨' 
    }]);
    setIsAIChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsAIChatOpen(false);
    setTimeout(() => {
      setChatMessages([]);
      setAiMood('');
    }, 300);
  };

  const askAI = async () => {
    if (!aiMood.trim()) return;
    const userMsg = aiMood.trim();
    setAiMood('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAILoading(true);
    
    const response = await sendChatMessage(userMsg);
    
    setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsAILoading(false);
  };

  const getAccessibilityClasses = () => {
    return '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-indigo-950 flex flex-col items-center justify-center text-white p-6 overflow-hidden">
        <div className="relative">
          <Coffee className="w-16 h-16 animate-bounce text-indigo-400 mb-4" />
          <div className="absolute inset-0 bg-indigo-400/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
        </div>
        <h1 className="text-3xl font-black tracking-widest font-serif mb-2">INDIGO COFFEE</h1>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_400ms]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pb-12 transition-all">
      {/* Premium Header */}
      <header className="w-full bg-indigo-950 text-white shadow-2xl sticky top-0 z-40 border-b border-indigo-500/30 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800/20 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="max-w-2xl mx-auto px-6 py-6 flex justify-between items-center relative z-10">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black tracking-widest font-serif text-white">INDIGO COFFEE</h1>
            <span className="text-[10px] tracking-[0.2em] uppercase text-indigo-300 -mt-1 font-bold">IDO & IDDO</span>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleOpenChat}
              className="p-2.5 rounded-full bg-indigo-900/50 text-indigo-200 hover:bg-indigo-800 hover:text-white transition-all ring-1 ring-indigo-500/30 flex items-center justify-center gap-2 group relative"
              title="AI Assistant"
            >
              <Sparkles className="w-5 h-5 group-hover:animate-spin-slow transition-transform" />
              {/* Optional Subtle Label */}
              <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider pl-1">AI Assistant</span>
            </button>
            <button 
              onClick={() => isAdminMode ? setIsAdminMode(false) : setActiveAdminView(AdminView.PIN_PAD)}
              className={`p-2.5 rounded-full transition-all flex items-center justify-center ring-1 ${isAdminMode ? 'bg-amber-500 text-indigo-950 ring-amber-400' : 'bg-indigo-900/50 text-indigo-300 ring-indigo-500/30 hover:text-white'}`}
            >
              {isAdminMode ? <LogOut className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Admin Mode Status Banner */}
      {isAdminMode && (
        <div className="w-full bg-amber-50 border-b border-amber-200 py-2 px-4 sticky top-[84px] z-30 flex justify-center items-center gap-4 text-xs font-bold text-amber-900 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            מצב ניהול פעיל - השינויים נשמרים בענן בזמן אמת
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("הקישור הועתק!");
            }}
            className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-amber-300 shadow-sm hover:bg-amber-100 transition-colors"
          >
            <QrCode className="w-3 h-3" />
            העתק כתובת
          </button>
        </div>
      )}

      {/* Main Menu Feed */}
      <main className="w-full max-w-2xl px-4 mt-8 space-y-12">
        {Object.entries(CATEGORIES).map(([key, label]) => {
          const items = menuItems.filter(item => item.category === key && (isAdminMode || item.available));
          if (!isAdminMode && items.length === 0) return null;

          return (
            <section key={key} className="relative group">
              <div className="flex items-center gap-4 mb-6 sticky top-24 bg-slate-50/90 backdrop-blur-md py-2 z-20 transition-all">
                <h2 className="text-2xl font-black text-indigo-950 font-serif whitespace-nowrap pr-4 border-r-4 border-indigo-500">
                  {label}
                </h2>
                <div className="h-[2px] bg-indigo-100 flex-grow"></div>
                {isAdminMode && (
                  <button 
                    onClick={() => {
                      setNewItemData({ ...newItemData, category: key as CategoryKey, image: DEFAULT_ICONS[key as CategoryKey] });
                      setAddingToCategory(key as CategoryKey);
                    }}
                    className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg active:scale-90 transition-transform"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {items.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => toggleAvailability(item)}
                    className={`
                      relative group/item overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-100 p-5
                      transition-all duration-300 
                      ${isAdminMode ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : ''}
                      ${!item.available ? 'opacity-40 grayscale-[0.5] bg-slate-50' : 'hover:border-indigo-200'}
                    `}
                  >
                    {!item.available && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm">
                        אזל מהמלאי
                      </div>
                    )}

                    <div className="flex gap-4 items-start">
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className={`font-bold text-lg text-indigo-950 ${!item.available ? 'line-through' : ''}`}>
                            {item.name}
                          </h3>
                        </div>
                        {item.description && (
                          <p className="text-sm text-slate-500 mb-3 leading-relaxed max-w-[90%]">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                           <span className="text-lg font-black text-indigo-600 font-mono">₪{item.price}</span>
                        </div>
                      </div>

                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl shadow-inner shrink-0 group-hover/item:scale-110 transition-transform overflow-hidden">
                        {item.image.startsWith('http') ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          item.image
                        )}
                      </div>
                    </div>

                    {/* Admin Actions Overlay */}
                    {isAdminMode && (
                      <div className="absolute bottom-4 left-4 flex gap-2">
                         <button 
                          onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}
                          className="p-2 bg-indigo-950 text-white rounded-xl shadow-lg hover:bg-indigo-800 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setItemToDelete(item); }}
                          className="p-2 bg-red-50 text-red-500 border border-red-100 rounded-xl shadow-sm hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <footer className="w-full mt-16 pb-24 text-center">
        <div className="flex flex-col items-center gap-4 text-slate-300">
           <div className="h-px w-24 bg-indigo-100 mb-4"></div>
           <p className="text-indigo-950 font-serif tracking-[0.3em] font-black text-xl">INDIGO COFFEE</p>
           <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium px-8">
             <Info className="w-3.5 h-3.5" />
             <span>המטבח שלנו אינו סטרילי וייתכנו עקבות של אלרגנים. פנו לצוות למידע נוסף.</span>
           </div>
        </div>
      </footer>

      {/* Floating AI Barista UI */}
      {isAIChatOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-indigo-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-indigo-950 sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh]">
            {/* Header */}
            <div className="p-6 text-white flex justify-between items-center relative">
               <button onClick={handleCloseChat} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors relative z-10">
                 <X className="w-5 h-5" />
               </button>
               
               <div className="flex flex-col items-center text-center relative z-10">
                 <h3 className="font-bold text-xl font-serif">Indigo AI Barista</h3>
                 <p className="text-[10px] text-indigo-300 uppercase tracking-widest font-bold">PERSONAL RECOMMENDATION</p>
               </div>

               <div className="w-10 h-10 bg-indigo-500/50 rounded-full flex items-center justify-center relative">
                 <Sparkles className="w-6 h-6 text-white" />
                 <div className="absolute -top-1 -right-1 bg-indigo-400 rounded-full p-0.5 border-2 border-indigo-950">
                    <Plus className="w-2 h-2 text-white" />
                 </div>
               </div>
            </div>
            
            {/* Content Area */}
            <div className="flex-grow overflow-y-auto p-4 sm:p-6 bg-slate-100/50 flex flex-col gap-4">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                  <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tl-none shadow-md' 
                      : 'bg-white border border-slate-100 text-slate-800 rounded-tr-none shadow-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="markdown-body prose prose-sm prose-indigo max-w-none">
                        <Markdown components={{
                          strong: ({node, ...props}) => <span className="text-indigo-700 font-black block mb-1 mt-3 first:mt-0" {...props} />,
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0 text-slate-600 font-medium leading-relaxed" {...props} />,
                          ol: ({node, ...props}) => <div className="space-y-4 my-3" {...props} />,
                          li: ({node, ...props}) => <div {...props} />
                        }}>
                          {msg.content}
                        </Markdown>
                      </div>
                    ) : (
                      <p className="font-medium leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isAILoading && (
                <div className="flex justify-start animate-in fade-in">
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tr-none p-4 shadow-sm flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                    <span className="text-sm text-indigo-900 font-bold animate-pulse italic">מקליד...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50">
               <div className="flex gap-2 items-center">
                 <input 
                  type="text" 
                  value={aiMood}
                  onChange={(e) => setAiMood(e.target.value)}
                  placeholder="הודעה..."
                  className="flex-grow bg-white border border-slate-200 rounded-full px-5 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 shadow-sm transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && askAI()}
                 />
                 <button 
                  onClick={askAI}
                  disabled={isAILoading || !aiMood.trim()}
                  className="bg-indigo-600 text-white w-12 h-12 rounded-full shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center shrink-0"
                 >
                   <Send className="w-5 h-5 transform -scale-x-100" />
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin PIN Pad Modal */}
      {activeAdminView === AdminView.PIN_PAD && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-indigo-950/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <div className="w-full max-w-xs bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center">
            <ShieldCheck className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-black text-indigo-950 mb-6">כניסת מנהל</h3>
            <form onSubmit={handlePinSubmit} className="w-full space-y-6">
               <input 
                 type="password"
                 inputMode="numeric"
                 autoFocus
                 maxLength={4}
                 value={pinInput}
                 onChange={(e) => setPinInput(e.target.value)}
                 className="w-full text-center text-4xl tracking-[0.5em] font-black border-b-2 border-slate-200 focus:border-indigo-600 outline-none py-3 transition-colors bg-transparent"
                 placeholder="0000"
               />
               <div className="grid grid-cols-2 gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setActiveAdminView(AdminView.NONE)}
                    className="py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-colors"
                  >
                    ביטול
                  </button>
                  <button 
                    type="submit"
                    className="py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
                  >
                    כניסה
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-indigo-950 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Pencil className="w-5 h-5" />
                עריכת מוצר
              </h3>
              <button onClick={() => setEditingItem(null)} className="hover:bg-white/10 p-2 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">שם הפריט</label>
                <input 
                  type="text" 
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">מחיר (₪)</label>
                <input 
                  type="text" 
                  value={editingItem.price}
                  onChange={(e) => setEditingItem({...editingItem, price: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">תמונה / אימוג'י</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    value={editingItem.image}
                    onChange={(e) => setEditingItem({...editingItem, image: e.target.value})}
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="אימוג'י או קישור לתמונה"
                  />
                  <label className={`cursor-pointer p-3 ${uploadSuccess ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'} rounded-xl hover:bg-opacity-80 transition-colors flex items-center justify-center`}>
                    {isUploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : uploadSuccess ? <CheckCircle className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, true)} disabled={isUploading} />
                  </label>
                </div>
                {editingItem.image.startsWith('http') && (
                  <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                    <img src={editingItem.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">תיאור</label>
                <textarea 
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEditingItem(null)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl">ביטול</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl hover:bg-indigo-700">שמור שינויים</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {addingToCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-5 h-5" />
                הוספת פריט ל{CATEGORIES[addingToCategory]}
              </h3>
              <button onClick={() => setAddingToCategory(null)} className="hover:bg-white/10 p-2 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddNewItem} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">שם הפריט</label>
                <input 
                  type="text" 
                  required
                  placeholder="לדוגמה: עוגת שמרים"
                  value={newItemData.name}
                  onChange={(e) => setNewItemData({...newItemData, name: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">מחיר</label>
                <input 
                  type="text" 
                  required
                  placeholder="25"
                  value={newItemData.price}
                  onChange={(e) => setNewItemData({...newItemData, price: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>
               <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">תמונה / אימוג'י</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    value={newItemData.image}
                    onChange={(e) => setNewItemData({...newItemData, image: e.target.value})}
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-center text-2xl"
                    placeholder="אימוג'י או קישור לתמונה"
                  />
                  <label className={`cursor-pointer p-3 ${uploadSuccess ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'} rounded-xl hover:bg-opacity-80 transition-colors flex items-center justify-center`}>
                    {isUploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : uploadSuccess ? <CheckCircle className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, false)} disabled={isUploading} />
                  </label>
                </div>
                {newItemData.image.startsWith('http') && (
                  <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden border border-slate-200 mx-auto">
                    <img src={newItemData.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">תיאור קצר</label>
                <textarea 
                  value={newItemData.description}
                  onChange={(e) => setNewItemData({...newItemData, description: e.target.value})}
                  rows={2}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none resize-none"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setAddingToCategory(null)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl">ביטול</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl hover:bg-indigo-700">הוסף לתפריט</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-indigo-950/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="w-full max-w-xs bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in duration-200">
             <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
               <AlertTriangle className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-black text-indigo-950 mb-2">מחיקת פריט</h3>
             <p className="text-slate-500 text-sm mb-8 leading-relaxed">
               האם אתם בטוחים שברצונכם למחוק את <span className="font-bold text-indigo-600">"{itemToDelete.name}"</span>? פעולה זו אינה ניתנת לביטול.
             </p>
             <div className="w-full space-y-3">
               <button 
                onClick={handleDeleteItem}
                className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl shadow-xl hover:bg-red-700 transition-all active:scale-95"
               >
                 כן, מחק פריט
               </button>
               <button 
                onClick={() => setItemToDelete(null)}
                className="w-full py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-all"
               >
                 לא, השאר אותו
               </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
