import React from 'react';
import Header from './Header';
import { motion } from 'framer-motion';

export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {children}
                </motion.div>
            </main>
            <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
                <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
                    &copy; {new Date().getFullYear()} The GreenCoders. SIH 2025 Project.
                </div>
            </footer>
        </div>
    );
}
