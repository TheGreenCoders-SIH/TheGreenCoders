import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sprout, LogOut, Shield, User, Activity, Bell, CreditCard, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LanguageSelector from './LanguageSelector';
import { T } from '../hooks/useTranslation';

export default function Header() {
    const location = useLocation();
    const { logout, isAdmin, isFarmer, userProfile } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    const closeMenu = () => setIsMenuOpen(false);

    const NavContent = ({ mobile = false }) => (
        <>
            {/* Role Badge - Show in menu on mobile to save space header */}
            <div className={`flex items-center px-3 py-1 bg-gray-100 rounded-lg ${mobile ? 'mb-4 w-fit' : 'mr-2'}`}>
                {isAdmin ? (
                    <>
                        <Shield className="w-4 h-4 text-blue-600 mr-1" />
                        <span className="text-sm font-medium text-blue-600">Admin</span>
                    </>
                ) : (
                    <>
                        <User className="w-4 h-4 text-green-600 mr-1" />
                        <span className="text-sm font-medium text-green-600">{userProfile?.farmerId}</span>
                    </>
                )}
            </div>

            {/* Dashboard Link */}
            <Link
                to={isAdmin ? "/admin" : "/dashboard"}
                onClick={mobile ? closeMenu : undefined}
                className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${isActive(isAdmin ? '/admin' : '/dashboard')
                    ? 'bg-green-600 text-white'
                    : 'text-gray-700 hover:bg-green-50'
                    }`}
            >
                <T>Dashboard</T>
            </Link>

            {/* My Card - Farmers only */}
            {isFarmer && (
                <Link
                    to="/mycard"
                    onClick={mobile ? closeMenu : undefined}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm flex items-center ${isActive('/mycard')
                        ? 'bg-green-600 text-white'
                        : 'text-gray-700 hover:bg-green-50'
                        }`}
                >
                    <CreditCard className="w-4 h-4 mr-1" />
                    <T>My Card</T>
                </Link>
            )}

            {/* Disease Detection - Farmers only */}
            {isFarmer && (
                <Link
                    to="/pest-detection"
                    onClick={mobile ? closeMenu : undefined}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm flex items-center ${isActive('/pest-detection')
                        ? 'bg-green-600 text-white'
                        : 'text-gray-700 hover:bg-green-50'
                        }`}
                >
                    <Activity className="w-4 h-4 mr-1" />
                    <T>Disease Detection</T>
                </Link>
            )}

            {/* Market Intel - Available to all */}
            <Link
                to="/market-intel"
                onClick={mobile ? closeMenu : undefined}
                className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${isActive('/market-intel')
                    ? 'bg-green-600 text-white'
                    : 'text-gray-700 hover:bg-green-50'
                    }`}
            >
                <T>Market</T>
            </Link>

            {/* Notifications - Farmers only */}
            {isFarmer && (
                <Link
                    to="/notifications"
                    onClick={mobile ? closeMenu : undefined}
                    className={`p-2 rounded-lg transition-colors flex items-center ${isActive('/notifications')
                        ? 'bg-green-600 text-white'
                        : 'text-gray-700 hover:bg-green-50'
                        }`}
                    title="Notifications"
                >
                    <Bell className="w-5 h-5 mr-1 md:mr-0" />
                    <span className={mobile ? 'block' : 'hidden'}><T>Notifications</T></span>
                </Link>
            )}

            {/* Language Selector */}
            <div className={mobile ? 'py-2' : ''}>
                <LanguageSelector />
            </div>

            {/* Logout */}
            <button
                onClick={() => {
                    logout();
                    if (mobile) closeMenu();
                }}
                className="px-3 py-2 rounded-lg font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center text-sm"
            >
                <LogOut className="w-4 h-4 mr-1" />
                <T>Logout</T>
            </button>
        </>
    );

    return (
        <header className="bg-white border-b border-green-100 sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center space-x-2 group shrink-0">
                    <div className="bg-green-600 p-2 rounded-lg group-hover:bg-green-700 transition-colors">
                        <Sprout className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 leading-none">GreenCoders</h1>
                        <p className="text-xs text-green-600 font-medium">E-Soil Smart System</p>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center space-x-2">
                    <NavContent />
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Navigation Overlay */}
            {isMenuOpen && (
                <div className="lg:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-100 shadow-xl p-4 flex flex-col space-y-2 animate-in slide-in-from-top-4 duration-200">
                    <NavContent mobile={true} />
                </div>
            )}
        </header>
    );
}
