import React, { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Download, Sprout, MapPin, Droplets, Activity, CloudRain, Thermometer, Wind } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';

export default function MyCards() {
    const { currentUser } = useAuth();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCard, setSelectedCard] = useState(null);
    const cardRef = useRef(null);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, `users/${currentUser.uid}/cards`),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cardsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCards(cardsData);
            setLoading(false);
        });

        return unsubscribe;
    }, [currentUser]);

    const downloadCard = async () => {
        if (!cardRef.current) return;
        try {
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: cardRef.current.scrollWidth,
                windowHeight: cardRef.current.scrollHeight,
            });

            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            const fileName = `soil-card-${selectedCard.farmerName.replace(/\s+/g, '-')}.png`;

            link.setAttribute('download', fileName);
            link.setAttribute('href', dataUrl);
            link.style.display = 'none';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error downloading card:", error);
            alert("Failed to download card. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">My Soil Cards</h2>

            {cards.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                    <Sprout className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No cards found. Create your first Soil Health Card!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.map((card) => (
                        <motion.div
                            key={card.id}
                            layoutId={card.id}
                            onClick={() => setSelectedCard(card)}
                            className="bg-white p-6 rounded-xl shadow-sm border border-green-100 cursor-pointer hover:shadow-md transition-all hover:border-green-300 group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800 group-hover:text-green-700 transition-colors">{card.farmerName}</h3>
                                    <p className="text-sm text-gray-500 flex items-center">
                                        <MapPin className="w-3 h-3 mr-1" /> {card.village}
                                    </p>
                                </div>
                                <div className="bg-green-50 p-2 rounded-lg">
                                    <QRCodeSVG
                                        value={`${window.location.origin}/view-card?data=${encodeURIComponent(JSON.stringify(card))}`}
                                        size={40}
                                        fgColor="#166534"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-gray-500 text-xs block">pH Level</span>
                                    <span className="font-semibold text-gray-700">{card.ph}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-gray-500 text-xs block">Org. Carbon</span>
                                    <span className="font-semibold text-gray-700">{card.organicCarbon}%</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedCard && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCard(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] overflow-y-auto"
                        >
                            <div ref={cardRef} className="p-8 bg-gradient-to-br from-white to-green-50 relative">
                                <div className="flex justify-between items-center mb-6 border-b border-green-100 pb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-green-800">E-Soil Health Card</h2>
                                        <p className="text-sm text-green-600">The GreenCoders Initiative</p>
                                    </div>
                                    <QRCodeSVG
                                        value={`${window.location.origin}/view-card?data=${encodeURIComponent(JSON.stringify(selectedCard))}`}
                                        size={64}
                                        fgColor="#166534"
                                    />
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase font-bold">Farmer Name</label>
                                            <p className="text-lg font-semibold text-gray-800">{selectedCard.farmerName}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase font-bold">Village</label>
                                            <p className="text-lg font-semibold text-gray-800">{selectedCard.village}</p>
                                        </div>
                                    </div>

                                    {/* Soil Parameters Grid */}
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                                            <Activity className="w-4 h-4 mr-1 text-green-600" /> Soil Parameters
                                        </h3>
                                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 bg-white p-4 rounded-xl border border-green-100 shadow-sm">
                                            <div className="text-center">
                                                <label className="text-xs text-gray-500 block">Nitrogen</label>
                                                <span className="font-bold text-gray-800">{selectedCard.N || selectedCard.npk?.split(':')[0]}</span>
                                            </div>
                                            <div className="text-center border-l border-gray-100">
                                                <label className="text-xs text-gray-500 block">Phosphorus</label>
                                                <span className="font-bold text-gray-800">{selectedCard.P || selectedCard.npk?.split(':')[1]}</span>
                                            </div>
                                            <div className="text-center border-l border-gray-100">
                                                <label className="text-xs text-gray-500 block">Potassium</label>
                                                <span className="font-bold text-gray-800">{selectedCard.K || selectedCard.npk?.split(':')[2]}</span>
                                            </div>
                                            <div className="text-center border-l border-gray-100">
                                                <label className="text-xs text-gray-500 block">pH</label>
                                                <span className="font-bold text-gray-800">{selectedCard.ph}</span>
                                            </div>
                                            <div className="text-center border-l border-gray-100">
                                                <label className="text-xs text-gray-500 block">Carbon</label>
                                                <span className="font-bold text-gray-800">{selectedCard.organicCarbon}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Weather Parameters Grid */}
                                    {(selectedCard.temperature || selectedCard.humidity || selectedCard.rainfall) && (
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                                                <CloudRain className="w-4 h-4 mr-1 text-blue-600" /> Weather Conditions
                                            </h3>
                                            <div className="grid grid-cols-3 gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                                                <div className="text-center">
                                                    <div className="flex justify-center mb-1"><Thermometer className="w-4 h-4 text-red-500" /></div>
                                                    <label className="text-xs text-gray-500 block">Temp</label>
                                                    <span className="font-bold text-gray-800">{selectedCard.temperature}°C</span>
                                                </div>
                                                <div className="text-center border-l border-blue-200">
                                                    <div className="flex justify-center mb-1"><Wind className="w-4 h-4 text-blue-500" /></div>
                                                    <label className="text-xs text-gray-500 block">Humidity</label>
                                                    <span className="font-bold text-gray-800">{selectedCard.humidity}%</span>
                                                </div>
                                                <div className="text-center border-l border-blue-200">
                                                    <div className="flex justify-center mb-1"><CloudRain className="w-4 h-4 text-blue-700" /></div>
                                                    <label className="text-xs text-gray-500 block">Rainfall</label>
                                                    <span className="font-bold text-gray-800">{selectedCard.rainfall}mm</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold">Recommendations</label>
                                        <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-100 mt-1">
                                            {selectedCard.recommendations}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 text-center text-xs text-gray-400">
                                    Generated on {selectedCard.createdAt?.toDate ? selectedCard.createdAt.toDate().toLocaleDateString() : 'Recently'}
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
                                <button
                                    onClick={() => setSelectedCard(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={downloadCard}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center shadow-sm"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Card
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
