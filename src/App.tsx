/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Mic, 
  User, 
  ChevronRight, 
  Star, 
  Plus, 
  Minus, 
  X, 
  MessageSquare, 
  Send, 
  LayoutDashboard, 
  ArrowRight,
  CreditCard,
  CheckCircle2,
  Check,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Types ---

export type Category = 'Audio' | 'Wearables' | 'Computing' | 'Mobile' | 'Home';

export interface ProductVariant {
  id: string;
  name: string;
  price?: number;
  image?: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  rating: number;
  stock: number;
  demand: number; // 0-100 for heatmap
  tags: string[];
  isNew?: boolean;
  variants?: ProductVariant[];
}

export interface CartItem extends Omit<Product, 'variants'> {
  quantity: number;
  selectedVariant?: ProductVariant;
}

export type UserInterest = Category | 'All';

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  orderHistory: {
    id: string;
    date: string;
    total: number;
    items: number;
  }[];
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}

// --- Constants ---

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Neon Pulse Headphones',
    description: 'Active noise cancelling with reactive RGB lighting.',
    price: 24999,
    category: 'Audio',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    stock: 15,
    demand: 85,
    tags: ['wireless', 'rgb', 'noise-cancelling'],
    isNew: true,
    variants: [
      { id: '1-1', name: 'Cyber Black', stock: 10 },
      { id: '1-2', name: 'Neon Emerald', stock: 5, price: 26999 },
      { id: '1-3', name: 'Void Purple', stock: 0 }
    ]
  },
  {
    id: '2',
    name: 'CyberWatch X',
    description: 'Holographic display with biometric health tracking.',
    price: 15999,
    category: 'Wearables',
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
    rating: 4.5,
    stock: 50,
    demand: 40,
    tags: ['smartwatch', 'holographic', 'health'],
    variants: [
      { id: '2-1', name: 'Standard', stock: 30 },
      { id: '2-2', name: 'Titanium Edition', stock: 20, price: 19999 }
    ]
  },
  {
    id: '3',
    name: 'Void Deck Laptop',
    description: 'Carbon-fiber chassis with dual OLED screens.',
    price: 199999,
    category: 'Computing',
    image: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    stock: 5,
    demand: 95,
    tags: ['laptop', 'oled', 'pro']
  },
  {
    id: '4',
    name: 'Neural Link Earbuds',
    description: 'Direct neural interface for lossless audio.',
    price: 11999,
    category: 'Audio',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    stock: 100,
    demand: 60,
    tags: ['earbuds', 'neural', 'lossless']
  },
  {
    id: '5',
    name: 'Prism Phone 14',
    description: 'Transparent glass back with liquid cooling.',
    price: 79999,
    category: 'Mobile',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    stock: 25,
    demand: 75,
    tags: ['smartphone', 'transparent', 'fast'],
    isNew: true
  },
  {
    id: '6',
    name: 'Zenith Smart Hub',
    description: 'AI-powered home automation controller.',
    price: 6999,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
    rating: 4.3,
    stock: 200,
    demand: 30,
    tags: ['home', 'ai', 'smart']
  },
  {
    id: '7',
    name: 'Ghost Keyboard',
    description: 'Silent mechanical switches with per-key RGB.',
    price: 9999,
    category: 'Computing',
    image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    stock: 45,
    demand: 70,
    tags: ['keyboard', 'mechanical', 'rgb']
  },
  {
    id: '8',
    name: 'Vector VR Headset',
    description: '8K resolution with full body tracking.',
    price: 64999,
    category: 'Wearables',
    image: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    stock: 12,
    demand: 90,
    tags: ['vr', 'gaming', 'immersive'],
    isNew: true
  },
  {
    id: '9',
    name: 'Titan GPU RTX',
    description: 'Next-gen ray tracing with 24GB VRAM.',
    price: 129999,
    category: 'Computing',
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    stock: 8,
    demand: 98,
    tags: ['gpu', 'gaming', 'nvidia'],
    isNew: true
  },
  {
    id: '10',
    name: 'Aura Smart Light',
    description: 'Ambient lighting with 16 million colors and voice control.',
    price: 4999,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80',
    rating: 4.4,
    stock: 150,
    demand: 45,
    tags: ['lighting', 'smart', 'home']
  },
  {
    id: '11',
    name: 'Quantum Tablet Pro',
    description: 'Ultra-thin tablet with liquid retina display.',
    price: 69999,
    category: 'Mobile',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    stock: 30,
    demand: 65,
    tags: ['tablet', 'mobile', 'pro']
  },
  {
    id: '12',
    name: 'Sonic Boom Speaker',
    description: '360-degree spatial audio with deep bass.',
    price: 19999,
    category: 'Audio',
    image: 'https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    stock: 60,
    demand: 55,
    tags: ['speaker', 'audio', 'bluetooth']
  },
  {
    id: '13',
    name: 'Nano-Fiber Smart Jacket',
    description: 'Adaptive thermal regulation with integrated solar charging.',
    price: 34999,
    category: 'Wearables',
    image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    stock: 20,
    demand: 78,
    tags: ['wearable', 'smart-fabric', 'solar'],
    isNew: true
  },
  {
    id: '14',
    name: 'Holo-Projector Pro',
    description: '3D holographic workspace with gesture control.',
    price: 89999,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    stock: 10,
    demand: 92,
    tags: ['hologram', 'pro', 'home-office']
  },
  {
    id: '15',
    name: 'Bio-Metric Smart Lock',
    description: 'DNA-encrypted security with remote neural access.',
    price: 12999,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    stock: 40,
    demand: 65,
    tags: ['security', 'biometric', 'smart-home']
  },
  {
    id: '16',
    name: 'Neural-Sync Glasses',
    description: 'AR overlay with real-time neural translation.',
    price: 45999,
    category: 'Wearables',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    stock: 25,
    demand: 88,
    tags: ['ar', 'glasses', 'neural'],
    isNew: true
  },
  {
    id: '17',
    name: 'Cryo-Cool Gaming Desk',
    description: 'Integrated liquid cooling for high-performance peripherals.',
    price: 124999,
    category: 'Computing',
    image: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    stock: 5,
    demand: 96,
    tags: ['gaming', 'desk', 'liquid-cooled']
  },
  {
    id: '18',
    name: 'Plasma-Edge Monitor',
    description: 'Zero-bezel 16K curved display with infinite contrast.',
    price: 159999,
    category: 'Computing',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    stock: 7,
    demand: 94,
    tags: ['monitor', '16k', 'plasma'],
    isNew: true
  }
];

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Navbar = ({ 
  cartCount, 
  onCartOpen, 
  onAdminOpen, 
  onProfileOpen,
  onSearch, 
  searchValue,
  currentView,
  setCurrentView,
  user,
  theme,
  setTheme
}: { 
  cartCount: number; 
  onCartOpen: () => void; 
  onAdminOpen: () => void;
  onProfileOpen: () => void;
  onSearch: (val: string) => void;
  searchValue: string;
  currentView: View;
  setCurrentView: (v: View) => void;
  user: UserProfile | null;
  theme: Theme;
  setTheme: (t: Theme) => void;
}) => {
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    if (!searchValue.trim()) return [];
    return PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      p.category.toLowerCase().includes(searchValue.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(searchValue.toLowerCase()))
    ).slice(0, 5);
  }, [searchValue]);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onSearch(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert("Microphone access denied. Please enable it in your browser settings.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
      setIsListening(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism h-20 px-8 flex items-center justify-between border-b border-border-main border-t-2 border-neon-emerald shadow-[0_-4px_20px_rgba(16,185,129,0.1)]">
      <div className="flex items-center gap-12">
        <button 
          onClick={() => setCurrentView('shop')} 
          className="text-3xl font-display font-black tracking-tighter text-primary hover:text-neon-emerald transition-colors"
        >
          FINIX<span className="text-neon-emerald">.</span>
        </button>
        <div className="hidden lg:flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.3em]">
          <button 
            onClick={() => setCurrentView('shop')} 
            className={cn("hover:text-neon-emerald transition-colors", currentView === 'shop' ? "text-neon-emerald" : "text-secondary")}
          >
            01/Shop
          </button>
          <button 
            onClick={() => setCurrentView('new-arrivals')} 
            className={cn("hover:text-neon-emerald transition-colors", currentView === 'new-arrivals' ? "text-neon-emerald" : "text-secondary")}
          >
            02/New
          </button>
          <button 
            onClick={() => setCurrentView('collections')} 
            className={cn("hover:text-neon-emerald transition-colors", currentView === 'collections' ? "text-neon-emerald" : "text-secondary")}
          >
            03/Collections
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-12">
        <div className="relative group">
          <input 
            type="text" 
            placeholder={isListening ? "LISTENING..." : "SEARCH_THE_FUTURE"} 
            className={cn(
              "w-full bg-dark-card border border-border-main py-2 px-4 pr-16 text-[10px] font-mono focus:outline-none focus:border-neon-emerald focus:ring-1 focus:ring-neon-emerald/30 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all placeholder:text-secondary/50 rounded-lg",
              isListening && "border-neon-emerald text-neon-emerald shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            )}
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-dark-card backdrop-blur-xl border border-neon-emerald/30 rounded-xl overflow-hidden z-[60] shadow-2xl"
              >
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSearch(p.name);
                      setShowSuggestions(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-neon-emerald/10 flex items-center gap-4 group transition-colors border-b border-border-main last:border-0"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-bg border border-border-main flex-shrink-0">
                      <img 
                        src={p.image} 
                        alt={p.name} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <span className="text-[10px] font-bold text-primary group-hover:text-neon-emerald transition-colors">
                        {p.name.toUpperCase()}
                      </span>
                      <span className="text-[8px] font-mono text-secondary uppercase tracking-widest">
                        {p.category}
                      </span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-secondary/40 group-hover:text-neon-emerald transition-transform group-hover:translate-x-1" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
            <button 
              onClick={startVoiceSearch}
              className={cn(
                "p-1.5 transition-all duration-300 rounded-full hover:bg-white/5",
                isListening ? "text-neon-emerald animate-pulse scale-110 bg-neon-emerald/10" : "text-white/20 hover:text-neon-emerald"
              )}
              title="Voice Search"
            >
              <Mic className={cn("w-4 h-4", isListening && "drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]")} />
            </button>
            <Search className="w-4 h-4 text-white/20 group-focus-within:text-neon-emerald transition-colors" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
          <button 
            onClick={() => setTheme('neon')}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              theme === 'neon' ? "bg-neon-emerald text-black" : "text-white/40 hover:text-white"
            )}
            title="Neon Dark"
          >
            <Flame className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setTheme('minimal')}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              theme === 'minimal' ? "bg-neon-cyan text-white" : "text-white/40 hover:text-white"
            )}
            title="Minimal Dark"
          >
            <LayoutDashboard className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setTheme('light')}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              theme === 'light' ? "bg-white text-black" : "text-white/40 hover:text-white"
            )}
            title="Light Mode"
          >
            <ChevronRight className="w-4 h-4 rotate-90" />
          </button>
        </div>

        <button 
          onClick={onProfileOpen} 
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
            user ? "border-neon-emerald/30 bg-neon-emerald/5 text-neon-emerald" : "border-border-main text-secondary hover:text-primary"
          )}
        >
          <User className="w-4 h-4" />
          {user && <span className="text-[10px] font-bold uppercase tracking-widest">{user.name.split(' ')[0]}</span>}
        </button>
        <button onClick={onAdminOpen} className="text-secondary hover:text-primary transition-colors">
          <LayoutDashboard className="w-4 h-4" />
        </button>
        <button 
          onClick={onCartOpen}
          className="group flex items-center gap-3 bg-dark-card border border-border-main px-4 py-2 rounded-full hover:bg-neon-emerald hover:border-neon-emerald transition-all"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-black">Cart</span>
          <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-[10px] font-mono group-hover:bg-black group-hover:text-neon-emerald">
            {cartCount}
          </div>
        </button>
      </div>
    </nav>
  );
};

const ProductCard = ({ product, onAddToCart, onOpenDetail }: { product: Product; onAddToCart: (p: Product) => void; onOpenDetail: (p: Product) => void }) => {
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1000);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-dark-card brutal-border overflow-hidden cursor-pointer"
      onClick={() => onOpenDetail(product)}
    >
      <div className="aspect-[4/5] overflow-hidden relative">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-dark-bg text-primary text-[8px] font-mono px-2 py-1 border border-border-main">
            ID_{product.id.padStart(3, '0')}
          </span>
        </div>
        <div className="absolute inset-0 bg-neon-emerald/20 opacity-0 group-hover:opacity-100 transition-opacity mix-blend-overlay" />
      </div>
      
      <div className="p-6 border-t border-border-main">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-display font-black tracking-tighter leading-none group-hover:text-neon-emerald transition-colors">
            {product.name.toUpperCase()}
          </h3>
          <span className="text-xs font-mono text-secondary">₹{product.price}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-secondary/50">
            {product.category}
          </span>
          <div className="relative">
            <AnimatePresence>
              {isAdded && (
                <motion.div
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-neon-emerald rounded-full pointer-events-none"
                />
              )}
            </AnimatePresence>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={handleAddToCart}
              className={cn(
                "w-8 h-8 rounded-full border border-border-main flex items-center justify-center transition-all relative z-10",
                isAdded ? "bg-neon-emerald text-dark-bg border-neon-emerald" : "hover:bg-primary hover:text-dark-bg"
              )}
            >
              {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ProductDetailModal = ({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart 
}: { 
  product: Product | null; 
  isOpen: boolean; 
  onClose: () => void; 
  onAddToCart: (p: Product, variant?: ProductVariant) => void;
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    if (product) {
      onAddToCart(product, selectedVariant || undefined);
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
        onClose();
      }, 800);
    }
  };

  useEffect(() => {
    if (product?.variants?.length) {
      const firstAvailable = product.variants.find(v => v.stock > 0) || product.variants[0];
      setSelectedVariant(firstAvailable);
    } else {
      setSelectedVariant(null);
    }
  }, [product]);

  if (!product) return null;

  const currentPrice = selectedVariant?.price || product.price;
  const currentImage = selectedVariant?.image || product.image;
  const currentStock = selectedVariant?.stock ?? product.stock;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-dark-bg/90 backdrop-blur-xl"
        >
          <div className="absolute inset-0" onClick={onClose} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl glass-morphism rounded-[32px] overflow-hidden flex flex-col md:flex-row shadow-2xl border-border-main"
          >
            <button 
              onClick={onClose} 
              className="absolute top-6 right-6 z-10 p-2 bg-dark-bg/40 hover:bg-primary/10 rounded-full transition-colors backdrop-blur-md"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-full md:w-1/2 h-80 md:h-auto relative">
              <motion.img 
                key={currentImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={currentImage} 
                alt={product.name} 
                className="w-full h-full object-cover brightness-90 contrast-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-neon-emerald bg-neon-emerald/10 px-3 py-1 rounded-full border border-neon-emerald/20">
                    {product.category}
                  </span>
                  {product.isNew && (
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-neon-cyan bg-neon-cyan/10 px-3 py-1 rounded-full border border-neon-cyan/20">
                      New Arrival
                    </span>
                  )}
                </div>
                <h2 className="text-4xl font-black tracking-tighter mb-4 leading-tight text-primary">{product.name}</h2>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-neon-cyan text-neon-cyan" />
                    <span className="text-sm font-bold text-primary">{product.rating}</span>
                  </div>
                  <span className="text-secondary/20">|</span>
                  <span className="text-sm text-secondary/40">{currentStock} units in stock</span>
                </div>
                <p className="text-secondary/80 text-lg leading-relaxed mb-8">
                  {product.description}
                </p>

                {product.variants && product.variants.length > 0 && (
                  <div className="mb-8">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-secondary/40 mb-3 block">Select Variant</span>
                    <div className="flex flex-wrap gap-3">
                      {product.variants.map(variant => (
                        <button
                          key={variant.id}
                          disabled={variant.stock === 0}
                          onClick={() => setSelectedVariant(variant)}
                          className={cn(
                            "px-4 py-2 rounded-xl border text-xs font-bold transition-all",
                            selectedVariant?.id === variant.id 
                              ? "bg-neon-emerald border-neon-emerald text-dark-bg" 
                              : "bg-dark-card border-border-main text-secondary/60 hover:border-neon-emerald/50",
                            variant.stock === 0 && "opacity-30 cursor-not-allowed grayscale"
                          )}
                        >
                          {variant.name.toUpperCase()}
                          {variant.price && variant.price !== product.price && (
                            <span className="ml-2 opacity-60">
                              {variant.price > product.price ? '+' : ''}₹{variant.price - product.price}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-8">
                  {product.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-mono text-secondary/40 bg-dark-card px-2 py-1 rounded-md border border-border-main">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between gap-6">
                <div>
                  <span className="text-xs text-secondary/40 uppercase tracking-widest block mb-1">Price</span>
                  <motion.span 
                    key={currentPrice}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-mono font-bold text-neon-emerald"
                  >
                    ₹{currentPrice}
                  </motion.span>
                </div>
                <div className="relative flex-1">
                  <AnimatePresence>
                    {isAdded && (
                      <motion.div
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-neon-emerald rounded-2xl pointer-events-none z-0"
                      />
                    )}
                  </AnimatePresence>
                  <motion.button 
                    disabled={currentStock === 0 || isAdded}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCart}
                    className={cn(
                      "w-full py-4 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all relative z-10",
                      isAdded 
                        ? "bg-neon-emerald text-dark-bg shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
                        : currentStock > 0 
                          ? "bg-primary text-dark-bg hover:bg-neon-emerald" 
                          : "bg-dark-card text-secondary/20 cursor-not-allowed"
                    )}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-5 h-5" />
                        Added!
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5" /> 
                        {currentStock > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const AIAssistant = ({ products }: { products: Product[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hey there! I'm Finix AI, your personal tech scout. Looking for something cool today? I'm here to help you find the perfect gear! 👋" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSend(transcript);
    };

    recognition.start();
  };

  const handleSend = async (textToSend?: string) => {
    const userMsg = textToSend || input;
    if (!userMsg.trim() || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const model = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: `You are Finix AI, a super friendly and helpful shopping buddy. Available products: ${JSON.stringify(products.map(p => ({ name: p.name, price: p.price, desc: p.description, cat: p.category })))}
            User Question: ${userMsg}` }] }
        ],
        config: {
          systemInstruction: "You are a super friendly, enthusiastic, and helpful shopping assistant. Talk to the user like a close friend—use casual language, emojis, and be very encouraging. Recommend specific products from the list if they match what the user is looking for. Keep it conversational and fun!"
        }
      });

      const response = await model;
      const text = response.text || "Oops, I hit a snag in the neural net! Mind trying that again, friend?";
      setMessages(prev => [...prev, { role: 'model', text }]);
      speak(text.replace(/[#*`]/g, ''));
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Aww man, I lost the connection! Let's try again in a bit." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-80 h-96 glass-morphism rounded-2xl flex flex-col overflow-hidden shadow-2xl border-neon-emerald/20"
          >
            <div className="p-4 border-b border-border-main flex justify-between items-center bg-neon-emerald/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-neon-emerald animate-pulse" />
                <span className="text-xs font-bold tracking-widest uppercase text-primary">Finix AI</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-secondary/40 hover:text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] p-3 rounded-2xl text-xs",
                    msg.role === 'user' 
                      ? "bg-neon-emerald text-black rounded-tr-none" 
                      : "bg-white/5 text-white/80 rounded-tl-none border border-white/10"
                  )}>
                    <div className="prose prose-invert prose-xs">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/10 flex gap-1">
                    <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-white/10 bg-black/20">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    placeholder={isListening ? "Listening..." : "Ask about a product..."}
                    className={cn(
                      "w-full bg-white/5 border border-white/10 rounded-full py-2 pl-4 pr-10 text-xs focus:outline-none focus:border-neon-emerald/50 transition-all",
                      isListening && "border-neon-emerald shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    )}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <button 
                    onClick={() => handleSend()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neon-emerald hover:scale-110 transition-transform"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <button 
                  onClick={startListening}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                    isListening ? "bg-red-500 text-white animate-pulse" : "bg-white/5 text-neon-emerald hover:bg-white/10"
                  )}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-neon-emerald text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform neon-glow-emerald"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    </div>
  );
};

const CartSidebar = ({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQty, 
  onRemove,
  onCheckout
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  items: CartItem[]; 
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}) => {
  const total = items.reduce((sum, item) => sum + (item.selectedVariant?.price || item.price) * item.quantity, 0);

  const recommendations = useMemo(() => {
    if (items.length === 0) return [];
    const currentCategories = new Set(items.map(i => i.category));
    return PRODUCTS.filter(p => !items.find(i => i.id === p.id) && currentCategories.has(p.category)).slice(0, 2);
  }, [items]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-dark-bg/60 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-dark-bg border-l border-border-main z-[70] flex flex-col"
          >
            <div className="p-6 border-b border-border-main flex justify-between items-center">
              <h2 className="text-xl font-bold tracking-tight text-primary">Your Cart</h2>
              <button onClick={onClose} className="p-2 hover:bg-primary/5 rounded-full transition-colors">
                <X className="w-5 h-5 text-secondary" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-secondary/40">
                  <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {items.map(item => (
                      <div key={item.id} className="flex gap-4 bg-dark-card p-3 rounded-xl border border-border-main">
                        <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" referrerPolicy="no-referrer" />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-medium text-primary">{item.name}</h4>
                            <button onClick={() => onRemove(item.id)} className="text-secondary/20 hover:text-red-400">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {item.selectedVariant && (
                            <p className="text-[10px] text-secondary/40 uppercase tracking-widest mt-1">
                              Variant: {item.selectedVariant.name}
                            </p>
                          )}
                          <p className="text-xs text-neon-emerald font-mono mt-1">₹{item.selectedVariant?.price || item.price}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <button 
                              onClick={() => onUpdateQty(item.id, -1)}
                              className="p-1 hover:bg-primary/10 rounded-md transition-colors text-primary"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-mono text-primary">{item.quantity}</span>
                            <button 
                              onClick={() => onUpdateQty(item.id, 1)}
                              className="p-1 hover:bg-primary/10 rounded-md transition-colors text-primary"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {recommendations.length > 0 && (
                    <div className="pt-6 border-t border-border-main">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-secondary/40 mb-4">Frequently Bought Together</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {recommendations.map(p => (
                          <div key={p.id} className="bg-dark-card p-2 rounded-xl border border-border-main group">
                            <img src={p.image} alt={p.name} className="w-full aspect-square object-cover rounded-lg mb-2" referrerPolicy="no-referrer" />
                            <h5 className="text-[10px] font-medium truncate text-primary">{p.name}</h5>
                            <p className="text-[10px] text-neon-emerald font-mono">₹{p.price}</p>
                            <button 
                              onClick={() => onUpdateQty(p.id, 1)} // Simple add for demo
                              className="w-full mt-2 py-1 bg-primary/10 hover:bg-neon-emerald hover:text-dark-bg rounded-lg text-[10px] font-bold transition-all text-primary"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-border-main bg-dark-bg/40">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-secondary/60">Subtotal</span>
                  <span className="text-xl font-mono font-bold text-neon-emerald">₹{total.toFixed(2)}</span>
                </div>
                <button 
                  onClick={onCheckout}
                  className="w-full py-4 bg-neon-emerald text-dark-bg font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Checkout <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Casper&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&backgroundColor=d1d4f9',
];

const LoginModal = ({ isOpen, onClose, onLogin }: { isOpen: boolean; onClose: () => void; onLogin: (user: UserProfile) => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email) {
      onLogin({ 
        name, 
        email, 
        avatar: selectedAvatar,
        orderHistory: [] 
      });
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-dark-bg/90 backdrop-blur-xl"
        >
          <div className="absolute inset-0" onClick={onClose} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md glass-morphism rounded-[32px] p-8 border border-border-main"
          >
            <h2 className="text-3xl font-display font-black tracking-tighter uppercase mb-2 text-primary">Initialize Profile</h2>
            <p className="text-secondary/40 text-sm mb-8">Connect your neural identity to the Finix network.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center gap-4 mb-8">
                {AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedAvatar(url)}
                    className={cn(
                      "w-12 h-12 rounded-full border-2 transition-all overflow-hidden bg-dark-card",
                      selectedAvatar === url ? "border-neon-emerald scale-110 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "border-transparent opacity-40 hover:opacity-100"
                    )}
                  >
                    <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-secondary/40 mb-2">Display Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Case_01"
                  className="w-full bg-dark-card border border-border-main rounded-xl p-4 text-sm focus:border-neon-emerald outline-none transition-all text-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-secondary/40 mb-2">Neural Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="case@void.net"
                  className="w-full bg-dark-card border border-border-main rounded-xl p-4 text-sm focus:border-neon-emerald outline-none transition-all text-primary"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-primary text-dark-bg font-bold rounded-xl hover:bg-neon-emerald transition-all uppercase tracking-widest text-xs"
              >
                Sync Identity
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ProfileModal = ({ isOpen, onClose, user, onLogout }: { isOpen: boolean; onClose: () => void; user: UserProfile | null; onLogout: () => void }) => {
  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-dark-bg/90 backdrop-blur-xl"
        >
          <div className="absolute inset-0" onClick={onClose} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md glass-morphism rounded-[32px] p-8 border border-border-main"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-neon-emerald/30 bg-dark-card overflow-hidden p-1">
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-black tracking-tighter uppercase leading-tight text-primary">{user.name}</h2>
                  <p className="text-neon-emerald text-[10px] font-mono">{user.email}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-primary/5 rounded-full transition-colors">
                <X className="w-6 h-6 text-secondary" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-dark-card border border-border-main rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-secondary/40">Order History</h3>
                  <span className="text-[10px] font-mono text-neon-emerald">{user.orderHistory.length} Transactions</span>
                </div>
                
                {user.orderHistory.length === 0 ? (
                  <p className="text-xs text-secondary/20 italic">No transactions recorded in the void.</p>
                ) : (
                  <div className="space-y-4 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                    {user.orderHistory.slice().reverse().map((order, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-dark-bg/50 rounded-xl border border-border-main">
                        <div>
                          <p className="text-[10px] font-mono text-secondary/60">#{order.id}</p>
                          <p className="text-[8px] text-secondary/20 uppercase mt-0.5">{order.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-neon-emerald">₹{order.total}</p>
                          <p className="text-[8px] text-secondary/40 uppercase">{order.items} Items</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-card border border-border-main rounded-2xl p-4">
                  <span className="block text-[8px] font-bold uppercase tracking-widest text-secondary/20 mb-1">Status</span>
                  <span className="text-xs font-bold text-neon-emerald uppercase">Elite Member</span>
                </div>
                <div className="bg-dark-card border border-border-main rounded-2xl p-4">
                  <span className="block text-[8px] font-bold uppercase tracking-widest text-secondary/20 mb-1">Credits</span>
                  <span className="text-xs font-bold text-primary uppercase">1,240 FC</span>
                </div>
              </div>

              <button 
                onClick={onLogout}
                className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest text-xs"
              >
                Disconnect Session
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const NewsletterForm = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validateEmail(email)) {
      setStatus('error');
      setErrorMsg('Invalid neural address format.');
      return;
    }

    setStatus('loading');
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 1500);
  };

  return (
    <div className="mt-8">
      <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary/40 mb-4">Join the Network</h4>
      {status === 'success' ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neon-emerald/10 border border-neon-emerald/20 rounded-xl p-4"
        >
          <p className="text-neon-emerald text-xs font-bold uppercase tracking-widest">Neural Link Established</p>
          <p className="text-secondary/40 text-[10px] mt-1 uppercase">Welcome to the Finix collective.</p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="neural_id@void.net"
              className={cn(
                "flex-1 bg-dark-card border rounded-xl px-4 py-3 text-xs outline-none transition-all text-primary",
                status === 'error' ? "border-red-500/50" : "border-border-main focus:border-neon-emerald/50"
              )}
            />
            <button 
              type="submit"
              disabled={status === 'loading'}
              className="bg-primary text-dark-bg px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-neon-emerald transition-all disabled:opacity-50"
            >
              {status === 'loading' ? 'Syncing...' : 'Connect'}
            </button>
          </div>
          
          <div className="flex items-start gap-2">
            <input 
              type="checkbox" 
              id="privacy-consent" 
              required 
              className="mt-0.5 accent-neon-emerald"
            />
            <label htmlFor="privacy-consent" className="text-[9px] text-secondary/30 uppercase tracking-wider leading-tight cursor-pointer">
              I agree to the <a href="#" className="underline hover:text-primary transition-colors">Neural Privacy Protocol</a> and data processing terms.
            </label>
          </div>

          <AnimatePresence>
            {status === 'error' && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-500 text-[9px] font-bold uppercase tracking-widest mt-2 ml-1"
              >
                {errorMsg}
              </motion.p>
            )}
          </AnimatePresence>
        </form>
      )}
    </div>
  );
};

const AdminDashboard = ({ isOpen, onClose, products }: { isOpen: boolean; onClose: () => void; products: Product[] }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
        >
          <div className="absolute inset-0 bg-dark-bg/80 backdrop-blur-md" onClick={onClose} />
          <div className="relative w-full max-w-4xl glass-morphism rounded-3xl overflow-hidden flex flex-col h-[80vh] border border-border-main">
            <div className="p-6 border-b border-border-main flex justify-between items-center bg-dark-card">
              <div>
                <h2 className="text-2xl font-bold tracking-tighter text-primary">Inventory Heatmap</h2>
                <p className="text-sm text-secondary/40">Real-time demand and stock monitoring</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-primary/5 rounded-full transition-colors">
                <X className="w-6 h-6 text-secondary" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(p => (
                  <div key={p.id} className="bg-dark-card border border-border-main p-4 rounded-2xl flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                      p.demand > 80 ? "bg-red-500/20 text-red-500" : 
                      p.demand > 50 ? "bg-orange-500/20 text-orange-500" : 
                      "bg-neon-emerald/20 text-neon-emerald"
                    )}>
                      <Flame className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold truncate text-primary">{p.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-secondary/40 uppercase tracking-widest">Stock: {p.stock}</span>
                        <span className="text-[10px] text-secondary/20">•</span>
                        <span className="text-[10px] text-secondary/40 uppercase tracking-widest">Demand: {p.demand}%</span>
                      </div>
                      <div className="w-full h-1 bg-primary/10 rounded-full mt-2 overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            p.demand > 80 ? "bg-red-500" : p.demand > 50 ? "bg-orange-500" : "bg-neon-emerald"
                          )}
                          style={{ width: `${p.demand}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const CheckoutModal = ({ isOpen, onClose, total, onComplete, cartItems }: { isOpen: boolean; onClose: () => void; total: number; onComplete: (items: CartItem[]) => void; cartItems: CartItem[] }) => {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'gpay' | 'phonepe' | null>(null);

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep(3);
      onComplete(cartItems);
    }, 2000);
  };

  const handlePhonePeSelect = () => {
    setPaymentMethod('phonepe');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-dark-bg/90 backdrop-blur-xl"
        >
          <div className="w-full max-w-lg glass-morphism rounded-3xl overflow-hidden border border-border-main">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex gap-2">
                  {[1, 2, 3].map(s => (
                    <div key={s} className={cn(
                      "w-8 h-1 rounded-full transition-all",
                      step >= s ? "bg-neon-emerald" : "bg-primary/10"
                    )} />
                  ))}
                </div>
                <button onClick={onClose} className="text-secondary/40 hover:text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="text-2xl font-bold mb-2 text-primary">Shipping Details</h2>
                  <p className="text-secondary/40 text-sm mb-6">Where should we send your tech?</p>
                  <div className="space-y-4">
                    <input type="text" placeholder="Full Name" className="w-full bg-dark-card border border-border-main rounded-xl p-3 text-sm focus:border-neon-emerald/50 outline-none text-primary" />
                    <input type="text" placeholder="Shipping Address" className="w-full bg-dark-card border border-border-main rounded-xl p-3 text-sm focus:border-neon-emerald/50 outline-none text-primary" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="City" className="w-full bg-dark-card border border-border-main rounded-xl p-3 text-sm focus:border-neon-emerald/50 outline-none text-primary" />
                      <input type="text" placeholder="Postal Code" className="w-full bg-dark-card border border-border-main rounded-xl p-3 text-sm focus:border-neon-emerald/50 outline-none text-primary" />
                    </div>
                  </div>
                  <button 
                    onClick={() => setStep(2)}
                    className="w-full mt-8 py-4 bg-primary text-dark-bg font-bold rounded-xl hover:bg-neon-emerald transition-colors"
                  >
                    Continue to Payment
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="text-2xl font-bold mb-2 text-primary">Payment</h2>
                  <p className="text-secondary/40 text-sm mb-6">Secure encrypted transaction</p>
                  
                  {!paymentMethod ? (
                    <div className="space-y-4">
                      <button 
                        onClick={handlePay}
                        disabled={isProcessing}
                        className="w-full py-4 bg-dark-bg border border-border-main rounded-xl flex items-center justify-center gap-3 hover:bg-primary/5 transition-colors text-primary"
                      >
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Google_Pay_%28GPay%29_Logo_%282020%29.svg" alt="GPay" className="h-5" />
                        {isProcessing ? "Processing..." : "Pay with Google Pay"}
                      </button>
                      <button 
                        onClick={handlePhonePeSelect}
                        disabled={isProcessing}
                        className="w-full py-4 bg-[#5f259f] text-white rounded-xl flex items-center justify-center gap-3 hover:bg-[#4a1d7c] transition-colors"
                      >
                        <img src="https://www.vectorlogo.zone/logos/phonepe/phonepe-icon.svg" alt="PhonePe" className="h-5 brightness-0 invert" />
                        Pay with PhonePe / UPI
                      </button>
                      <button 
                        onClick={handlePay}
                        disabled={isProcessing}
                        className="w-full py-4 bg-primary text-dark-bg rounded-xl flex items-center justify-center gap-3 hover:bg-neon-emerald transition-colors"
                      >
                        <CreditCard className="w-5 h-5" />
                        {isProcessing ? "Processing..." : "Pay with Credit Card"}
                      </button>
                    </div>
                  ) : paymentMethod === 'phonepe' ? (
                    <div className="text-center">
                      <div className="bg-white p-4 rounded-2xl inline-block mb-6 shadow-[0_0_20px_rgba(95,37,159,0.3)]">
                        {/* QR Code Placeholder - In a real app, this would be generated dynamically */}
                        <div className="w-48 h-48 bg-black flex items-center justify-center relative overflow-hidden rounded-lg">
                          <img 
                            src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=phonepe://pay?pa=finix@upi&pn=FinixTech&am=1.00" 
                            alt="Scan to Pay" 
                            className="w-full h-full"
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-white p-1 rounded-full shadow-lg">
                              <img src="https://www.vectorlogo.zone/logos/phonepe/phonepe-icon.svg" alt="PP" className="w-6 h-6" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-secondary/60 mb-6">Scan the QR code using any UPI app to complete payment</p>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setPaymentMethod(null)}
                          className="flex-1 py-3 bg-dark-card border border-border-main rounded-xl text-sm hover:bg-primary/10 transition-colors text-primary"
                        >
                          Back
                        </button>
                        <button 
                          onClick={handlePay}
                          disabled={isProcessing}
                          className="flex-[2] py-3 bg-neon-emerald text-dark-bg font-bold rounded-xl text-sm hover:scale-[1.02] transition-all"
                        >
                          {isProcessing ? "Verifying..." : "I have paid"}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-8 pt-6 border-t border-border-main flex justify-between items-center">
                    <span className="text-secondary/40 text-sm">Total Amount</span>
                    <span className="text-xl font-mono font-bold text-neon-emerald">₹{total.toFixed(2)}</span>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                  <div className="w-16 h-16 bg-neon-emerald/20 text-neon-emerald rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-primary">Order Confirmed</h2>
                  <p className="text-secondary/40 text-sm mb-4">Your tech is being prepared for dispatch. Check your neural link for updates.</p>
                  
                  {paymentMethod === 'phonepe' && (
                    <div className="flex items-center justify-center gap-2 mb-6 bg-[#5f259f]/10 border border-[#5f259f]/20 py-2 px-4 rounded-full w-fit mx-auto">
                      <img src="https://www.vectorlogo.zone/logos/phonepe/phonepe-icon.svg" alt="PP" className="w-4 h-4" />
                      <span className="text-[10px] font-bold text-[#9d62e0] uppercase tracking-widest">Paid via PhonePe</span>
                    </div>
                  )}
                  
                  <div className="bg-dark-card border border-border-main rounded-2xl p-4 mb-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary/40 mb-3">Payment Scanner Option</p>
                    <div className="bg-white p-2 rounded-xl inline-block mb-2">
                      <div className="w-32 h-32 bg-black flex items-center justify-center relative overflow-hidden rounded-lg">
                        <img 
                          src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=phonepe://pay?pa=finix@upi&pn=FinixTech&am=1.00" 
                          alt="PhonePe QR" 
                          className="w-full h-full"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-white p-0.5 rounded-full shadow-lg">
                            <img src="https://www.vectorlogo.zone/logos/phonepe/phonepe-icon.svg" alt="PP" className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-[9px] text-secondary/30">Scan to verify transaction or join Finix Elite</p>
                  </div>

                  <button 
                    onClick={onClose}
                    className="w-full py-3 bg-primary text-dark-bg font-bold rounded-xl hover:bg-neon-emerald transition-colors"
                  >
                    Back to Shop
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Main App ---

type View = 'shop' | 'new-arrivals' | 'collections';
type SortOption = 'default' | 'price-low' | 'price-high' | 'rating';
type Theme = 'neon' | 'minimal' | 'light';

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userInterest, setUserInterest] = useState<UserInterest>('All');
  const [currentView, setCurrentView] = useState<View>('shop');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [viewedProductIds, setViewedProductIds] = useState<string[]>([]);
  const [purchasedProductIds, setPurchasedProductIds] = useState<string[]>([]);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('finix_theme');
    return (saved as Theme) || 'neon';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark-minimal', 'theme-light');
    if (theme === 'minimal') root.classList.add('theme-dark-minimal');
    if (theme === 'light') root.classList.add('theme-light');
    localStorage.setItem('finix_theme', theme);
  }, [theme]);

  // Load user data from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('finix_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
  }, []);

  // Save user data to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('finix_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('finix_user');
    }
  }, [user]);

  const handleLogin = (newUser: UserProfile) => {
    setUser(newUser);
    setIsLoginOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setIsProfileOpen(false);
  };

  const handleProfileClick = () => {
    if (user) {
      setIsProfileOpen(true);
    } else {
      setIsLoginOpen(true);
    }
  };

  // Predictive Layout Logic
  const featuredProducts = useMemo(() => {
    if (userInterest === 'All') return PRODUCTS.filter(p => p.demand > 80);
    return PRODUCTS.filter(p => p.category === userInterest);
  }, [userInterest]);

  const recommendedProducts = useMemo(() => {
    if (viewedProductIds.length === 0 && purchasedProductIds.length === 0) {
      return PRODUCTS.filter(p => p.demand > 85).slice(0, 4);
    }

    const userInterests = new Set<string>();
    const userTags = new Set<string>();

    [...viewedProductIds, ...purchasedProductIds].forEach(id => {
      const p = PRODUCTS.find(prod => prod.id === id);
      if (p) {
        userInterests.add(p.category);
        p.tags.forEach(t => userTags.add(t));
      }
    });

    return PRODUCTS
      .filter(p => !purchasedProductIds.includes(p.id))
      .map(p => {
        let score = 0;
        if (userInterests.has(p.category)) score += 10;
        p.tags.forEach(t => {
          if (userTags.has(t)) score += 2;
        });
        if (viewedProductIds.includes(p.id)) score += 5;
        return { ...p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [viewedProductIds, purchasedProductIds]);

  const filteredProducts = useMemo(() => {
    let base = [...PRODUCTS];
    if (currentView === 'new-arrivals') {
      base = PRODUCTS.filter(p => p.isNew);
    }
    
    let result = base;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = base.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // Apply Sorting
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // Default sorting (e.g., by demand or original order)
        break;
    }

    return result;
  }, [searchQuery, currentView, sortBy]);

  const collections = useMemo(() => {
    const cats = Array.from(new Set(PRODUCTS.map(p => p.category)));
    return cats.map(cat => ({
      name: cat,
      image: PRODUCTS.find(p => p.category === cat)?.image || '',
      count: PRODUCTS.filter(p => p.category === cat).length
    }));
  }, []);

  const addToCart = (product: Product, variant?: ProductVariant) => {
    setCart(prev => {
      const cartItemId = variant ? `${product.id}-${variant.id}` : product.id;
      const existing = prev.find(item => {
        const itemId = item.selectedVariant ? `${item.id}-${item.selectedVariant.id}` : item.id;
        return itemId === cartItemId;
      });

      if (existing) {
        return prev.map(item => {
          const itemId = item.selectedVariant ? `${item.id}-${item.selectedVariant.id}` : item.id;
          return itemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item;
        });
      }
      // Update user interest based on what they add
      setUserInterest(product.category);
      
      const { variants, ...productBase } = product;
      return [...prev, { 
        ...productBase, 
        price: variant?.price || product.price,
        image: variant?.image || product.image,
        quantity: 1, 
        selectedVariant: variant 
      }];
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      const itemId = item.selectedVariant ? `${item.id}-${item.selectedVariant.id}` : item.id;
      if (itemId === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => {
      const itemId = item.selectedVariant ? `${item.id}-${item.selectedVariant.id}` : item.id;
      return itemId !== id;
    }));
  };

  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    if (!viewedProductIds.includes(product.id)) {
      setViewedProductIds(prev => [...prev, product.id]);
    }
  };

  const handleCheckoutComplete = (items: CartItem[]) => {
    const ids = items.map(i => i.id);
    const total = items.reduce((s, i) => s + (i.selectedVariant?.price || i.price) * i.quantity, 0);
    setPurchasedProductIds(prev => Array.from(new Set([...prev, ...ids])));
    
    if (user) {
      const orderId = Math.random().toString(36).substring(2, 9).toUpperCase();
      const newOrder = {
        id: orderId,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        total: total,
        items: items.reduce((s, i) => s + i.quantity, 0)
      };
      setUser(prev => prev ? {
        ...prev,
        orderHistory: [...prev.orderHistory, newOrder]
      } : null);
    }
    
    setCart([]);
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-neon-emerald selection:text-black">
      <Navbar 
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)} 
        onCartOpen={() => setIsCartOpen(true)}
        onAdminOpen={() => setIsAdminOpen(true)}
        onProfileOpen={handleProfileClick}
        onSearch={setSearchQuery}
        searchValue={searchQuery}
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        theme={theme}
        setTheme={setTheme}
      />

      <main className="pt-32 px-8 max-w-[1600px] mx-auto bg-dark-bg text-primary">
        {/* Marquee Ticker */}
        <div className="mb-12 border-y border-border-main py-4 marquee-container">
          <div className="marquee-content flex gap-12 items-center">
            {[...Array(10)].map((_, i) => (
              <React.Fragment key={i}>
                <span className="text-[10px] font-mono text-neon-emerald">SYSTEM_STATUS: OPTIMAL</span>
                <span className="text-[10px] font-mono text-secondary/20">/</span>
                <span className="text-[10px] font-mono text-primary">NEW_DROP_LIVE</span>
                <span className="text-[10px] font-mono text-secondary/20">/</span>
                <span className="text-[10px] font-mono text-neon-cyan">GLOBAL_SHIPPING_AVAILABLE</span>
                <span className="text-[10px] font-mono text-secondary/20">/</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {currentView === 'shop' && (
            <motion.div
              key="shop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Hero Section */}
              <section className="mb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7">
                  <div className="relative">
                    <span className="absolute -top-12 left-0 text-[120px] font-display font-black text-primary/5 leading-none -z-10">
                      FINIX
                    </span>
                    <motion.h1 
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[clamp(4rem,10vw,12rem)] font-display font-black tracking-tighter leading-[0.85] mb-12 uppercase text-primary"
                    >
                      Future <br /> 
                      <span className="text-neon-emerald italic">Standard</span>
                    </motion.h1>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-12 items-start">
                    <p className="text-secondary/40 text-lg max-w-sm leading-relaxed font-light">
                      A curated selection of high-performance technology for the modern digital nomad. 
                      Engineered for performance, designed for the void.
                    </p>
                    <div className="flex flex-col gap-4">
                      <button 
                        onClick={() => setCurrentView('collections')}
                        className="group flex items-center gap-4 bg-primary text-dark-bg px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-neon-emerald transition-all"
                      >
                        Explore Catalog <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                      </button>
                      <span className="text-[10px] font-mono text-secondary/20 uppercase">Est. 2026 / Neo-Tokyo</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 relative aspect-[4/5]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={userInterest}
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="w-full h-full brutal-border brutal-shadow overflow-hidden"
                    >
                      <img 
                        src={featuredProducts[0]?.image || PRODUCTS[0].image}
                        alt="Featured"
                        className="w-full h-full object-cover grayscale brightness-75 contrast-125"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-8 left-8 right-8 p-6 glass-morphism border border-white/10">
                        <span className="text-[10px] font-mono text-neon-emerald mb-2 block">RECOMMENDED_FOR_YOU</span>
                        <h3 className="text-2xl font-display font-black tracking-tighter uppercase">{featuredProducts[0]?.name}</h3>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </section>

              {/* Recommended Section */}
              <section className="mb-32">
                <div className="flex items-baseline gap-6 mb-16 border-b border-border-main pb-8">
                  <span className="text-6xl font-display font-black text-secondary/10">01</span>
                  <h2 className="text-4xl font-display font-black tracking-tighter uppercase text-primary">Recommended_For_You</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border-main border border-border-main">
                  <AnimatePresence mode="popLayout">
                    {recommendedProducts.map(product => (
                      <div key={product.id} className="bg-dark-bg">
                        <ProductCard product={product} onAddToCart={addToCart} onOpenDetail={handleOpenProduct} />
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>

              {/* Featured Section */}
              <section className="mb-32">
                <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16 border-b border-border-main pb-8">
                  <div className="flex items-baseline gap-6">
                    <span className="text-6xl font-display font-black text-secondary/10">02</span>
                    <h2 className="text-4xl font-display font-black tracking-tighter uppercase text-primary">Trending_Now</h2>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {(['All', 'Audio', 'Wearables', 'Computing', 'Mobile', 'Home'] as (UserInterest | Category)[]).map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setUserInterest(cat as UserInterest)}
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-widest px-6 py-2 border transition-all",
                          userInterest === cat ? "bg-primary text-dark-bg border-primary" : "text-secondary/40 border-border-main hover:border-secondary/40"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/10">
                  <AnimatePresence mode="popLayout">
                    {featuredProducts.slice(0, 4).map(product => (
                      <div key={product.id} className="bg-dark-bg">
                        <ProductCard product={product} onAddToCart={addToCart} onOpenDetail={setSelectedProduct} />
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>

              {/* All Products */}
              <section className="mb-32">
                <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16 border-b border-border-main pb-8">
                  <div className="flex items-baseline gap-6">
                    <span className="text-6xl font-display font-black text-secondary/10">03</span>
                    <h2 className="text-4xl font-display font-black tracking-tighter uppercase text-primary">Full_Catalog</h2>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-secondary/20">Sort By:</span>
                    <div className="flex gap-2">
                      {(['default', 'price-low', 'price-high', 'rating'] as SortOption[]).map(option => (
                        <button
                          key={option}
                          onClick={() => setSortBy(option)}
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-widest px-4 py-2 border transition-all",
                            sortBy === option ? "bg-neon-emerald text-dark-bg border-neon-emerald" : "text-secondary/40 border-border-main hover:border-secondary/40"
                          )}
                        >
                          {option.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border-main border border-border-main">
                  <AnimatePresence mode="popLayout">
                    {filteredProducts.map(product => (
                      <div key={product.id} className="bg-dark-bg">
                        <ProductCard product={product} onAddToCart={addToCart} onOpenDetail={handleOpenProduct} />
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            </motion.div>
          )}

          {currentView === 'new-arrivals' && (
            <motion.div
              key="new-arrivals"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-24 flex flex-col items-center">
                <span className="text-[10px] font-mono text-neon-emerald mb-4 tracking-[0.5em]">LATEST_DROPS</span>
                <h2 className="text-[12vw] font-display font-black tracking-tighter leading-none uppercase text-center text-primary">New<br/><span className="italic text-neon-emerald">Arrivals</span></h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border-main border border-border-main">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map(product => (
                    <div key={product.id} className="bg-dark-bg">
                      <ProductCard product={product} onAddToCart={addToCart} onOpenDetail={handleOpenProduct} />
                    </div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {currentView === 'collections' && (
            <motion.div
              key="collections"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-24">
                <h2 className="text-[10vw] font-display font-black tracking-tighter leading-none uppercase text-primary">Curated<br/>Collections</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {collections.map((col, i) => (
                  <motion.div 
                    key={col.name}
                    whileHover={{ y: -10 }}
                    onClick={() => {
                      setSearchQuery(col.name);
                      setCurrentView('shop');
                    }}
                    className="group cursor-pointer"
                  >
                    <div className="relative aspect-[3/4] mb-8 brutal-border overflow-hidden border-border-main">
                      <img 
                        src={col.image} 
                        alt={col.name} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-8 left-8">
                        <span className="text-6xl font-display font-black text-secondary/20">0{i+1}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <h3 className="text-3xl font-display font-black tracking-tighter uppercase mb-2 text-primary">{col.name}</h3>
                        <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">{col.count} Items Available</p>
                      </div>
                      <div className="w-12 h-12 brutal-border flex items-center justify-center group-hover:bg-neon-emerald group-hover:text-dark-bg transition-all border-border-main">
                        <ArrowRight className="w-6 h-6 text-primary group-hover:text-dark-bg" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredProducts.length === 0 && currentView !== 'collections' && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 mx-auto mb-4 text-white/10" />
            <h3 className="text-xl font-bold mb-2">No products found</h3>
            <p className="text-white/40">Try adjusting your search or filters.</p>
          </div>
        )}
      </main>

      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cart}
        onUpdateQty={updateCartQty}
        onRemove={removeFromCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <AdminDashboard 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
        products={PRODUCTS} 
      />

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onLogin={handleLogin} 
      />

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        user={user} 
        onLogout={handleLogout} 
      />

      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        total={cart.reduce((s, i) => s + (i.selectedVariant?.price || i.price) * i.quantity, 0)} 
        onComplete={handleCheckoutComplete}
        cartItems={cart}
      />

      <ProductDetailModal 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />

      <AIAssistant products={PRODUCTS} />

      {/* Footer */}
      <footer className="border-t border-border-main py-12 px-6 mt-20 bg-dark-bg">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-2xl font-bold tracking-tighter text-neon-emerald mb-6">FINIX</h2>
            <p className="text-secondary/40 text-sm max-w-sm leading-relaxed">
              Redefining the digital boundary. Finix provides the tools for the next evolution of human-tech interaction.
            </p>
            <NewsletterForm />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-6 text-primary">Support</h4>
            <ul className="space-y-4 text-sm text-secondary/40">
              <li><a href="#" className="hover:text-neon-emerald transition-colors">Shipping</a></li>
              <li><a href="#" className="hover:text-neon-emerald transition-colors">Returns</a></li>
              <li><a href="#" className="hover:text-neon-emerald transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-6 text-primary">Legal</h4>
            <ul className="space-y-4 text-sm text-secondary/40">
              <li><a href="#" className="hover:text-neon-emerald transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-neon-emerald transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-neon-emerald transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-12 border-t border-border-main flex justify-between items-center text-[10px] text-secondary/20 uppercase tracking-[0.2em]">
          <span>© 2026 Finix Systems. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">Instagram</a>
            <a href="#" className="hover:text-primary transition-colors">NeuralNet</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
