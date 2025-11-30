// MyCard Page - Display and download farmer's soil health card
import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Download, Loader2, AlertCircle, FileText } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { generateSoilHealthReport, downloadPDF } from '../lib/pdfReports';
import { motion } from 'framer-motion';

export default function MyCard() {
    const { currentUser, userProfile } = useAuth();
    const [card, setCard] = useState(null);
    const [loading, setLoading] = useState(true);
    const cardRef = useRef(null);

    useEffect(() => {
        if (currentUser && userProfile) {
            loadCardData();
        }
    }, [currentUser, userProfile]);

    const loadCardData = async () => {
        try {
            const farmerRef = doc(db, 'farmers', userProfile.farmerId);
            const farmerSnap = await getDoc(farmerRef);

            if (farmerSnap.exists()) {
                const cardData = farmerSnap.data().card;
                setCard(cardData);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading card:', error);
            setLoading(false);
        }
    };

    const downloadCard = async () => {
        if (!cardRef.current) return;

        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false
            });

            const link = document.createElement('a');
            link.download = `soil-health-card-${userProfile.farmerId}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Error downloading card:', error);
            alert('Failed to download card');
        }
    };

    const downloadPDFReport = () => {
        if (!card) {
            alert('No card data available');
            return;
        }

        try {
            console.log('Generating PDF with card data:', card);
            console.log('Farmer ID:', userProfile.farmerId);

            // Ensure all required fields exist
            const completeCard = {
                farmerName: card.farmerName || 'Unknown',
                phone: card.phone || 'N/A',
                village: card.village || 'N/A',
                district: card.district || 'N/A',
                state: card.state || 'N/A',
                farmSize: card.farmSize || '2.5',
                ph: card.ph || 7.0,
                npk: card.npk || '120:60:80',
                organicCarbon: card.organicCarbon || 0.5,
                ec: card.ec || 0.5,
                texture: card.texture || 'Loamy',
                soilGrade: card.soilGrade || 'B'
            };

            console.log('Complete card data:', completeCard);
            const pdfDoc = generateSoilHealthReport(completeCard, userProfile.farmerId);
            console.log('PDF document created successfully');
            downloadPDF(pdfDoc, `soil-health-report-${userProfile.farmerId}.pdf`);
        } catch (error) {
            console.error('Detailed PDF generation error:', error);
            console.error('Error stack:', error.stack);
            alert(`Failed to generate PDF report: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
        );
    }

    if (!card) {
        return (
            <div className="max-w-2xl mx-auto mt-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 mb-4">You haven't created your soil health card yet.</p>
                    <a
                        href="/new-card"
                        className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors"
                    >
                        Create Your Card
                    </a>
                </div>
            </div>
        );
    }

    const getHealthColor = (grade) => {
        switch (grade) {
            case 'A': return 'from-green-400 to-green-600';
            case 'B': return 'from-blue-400 to-blue-600';
            case 'C': return 'from-yellow-400 to-yellow-600';
            case 'D': return 'from-orange-400 to-orange-600';
            case 'E': return 'from-red-400 to-red-600';
            default: return 'from-gray-400 to-gray-600';
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-green-700 to-green-800 text-white rounded-2xl p-6">
                <h1 className="text-2xl font-bold mb-1">My Soil Health Card</h1>
                <p className="text-green-100">View and download your personalized soil health card</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
                <button
                    onClick={downloadCard}
                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md"
                >
                    <Download className="w-5 h-5 mr-2" />
                    Download Card as PNG
                </button>

                <button
                    onClick={downloadPDFReport}
                    className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-md"
                >
                    <FileText className="w-5 h-5 mr-2" />
                    Download PDF Report
                </button>
            </div>

            {/* Card Display */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
                <div ref={cardRef} className="p-8">
                    {/* Card Header */}
                    <div className={`bg-gradient-to-r ${getHealthColor(card.soilGrade)} text-white px-6 py-4 rounded-lg mb-6`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">E-Soil Health Card</h2>
                                <p className="text-sm opacity-90">Government of India</p>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold">{card.soilGrade}</div>
                                <div className="text-xs">Soil Grade</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Farmer Details */}
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 mb-3">Farmer Details</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <div className="text-xs text-gray-500">Name</div>
                                        <div className="font-medium text-gray-800">{card.farmerName}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Phone</div>
                                        <div className="font-medium text-gray-800">{card.phone}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Village</div>
                                        <div className="font-medium text-gray-800">{card.village}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">District</div>
                                        <div className="font-medium text-gray-800">{card.district}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">State</div>
                                        <div className="font-medium text-gray-800">{card.state}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Farmer ID</div>
                                        <div className="font-medium text-gray-800">{userProfile.farmerId}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Soil Parameters */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 mb-3">Soil Parameters</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <div className="text-xs text-blue-600">pH Level</div>
                                        <div className="text-xl font-bold text-blue-700">{card.ph}</div>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <div className="text-xs text-green-600">Organic Carbon (%)</div>
                                        <div className="text-xl font-bold text-green-700">{card.organicCarbon}</div>
                                    </div>
                                    <div className="bg-purple-50 p-3 rounded-lg">
                                        <div className="text-xs text-purple-600">NPK Ratio</div>
                                        <div className="text-xl font-bold text-purple-700">{card.npk}</div>
                                    </div>
                                    <div className="bg-yellow-50 p-3 rounded-lg">
                                        <div className="text-xs text-yellow-600">EC (dS/m)</div>
                                        <div className="text-xl font-bold text-yellow-700">{card.ec}</div>
                                    </div>
                                    <div className="bg-orange-50 p-3 rounded-lg col-span-2">
                                        <div className="text-xs text-orange-600">Soil Texture</div>
                                        <div className="text-xl font-bold text-orange-700">{card.texture}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-6">
                            <div className="bg-white p-4 rounded-lg shadow-sm mb-3">
                                <QRCodeCanvas
                                    value={JSON.stringify({
                                        farmerId: userProfile.farmerId,
                                        name: card.farmerName,
                                        phone: card.phone,
                                        village: card.village
                                    })}
                                    size={160}
                                    level="H"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center">Scan for details</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                        <p className="text-xs text-gray-500">
                            Generated on {new Date().toLocaleDateString()} | The GreenCoders Initiative
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
