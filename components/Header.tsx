import React, { useState, useRef, useEffect, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { PageTitleContext } from '../contexts/PageTitleContext';
import Modal from './common/Modal';

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const { title } = useContext(PageTitleContext);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <>
            <header className="bg-surface z-10 border-b border-border-color h-20">
                <div className="w-full max-w-screen-xl mx-auto h-full px-4 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-text-primary">{title}</h1>
                    {user && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center space-x-3 p-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-primary-dark shadow-soft"
                            >
                                <div className="text-left">
                                    <div className="font-bold text-white text-sm leading-tight">{user.name}</div>
                                    <div className="text-xs text-blue-200 uppercase tracking-wide">{user.role}</div>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-blue-200 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg py-1 z-20 animate-scale-in origin-top-right">
                                    <button
                                        onClick={() => {
                                            setIsProfileModalOpen(true);
                                            setIsDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-100 transition-colors flex items-center space-x-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                        <span>My Profile</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setIsDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-red-100 transition-colors font-semibold flex items-center space-x-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
                                        <span>Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="My Profile">
                {user && (
                    <div className="space-y-4 text-text-primary p-2">
                        <div className="flex border-b border-border-color pb-2">
                            <div className="w-28 font-semibold text-text-secondary">Name</div>
                            <div className="font-medium">{user.name}</div>
                        </div>
                        <div className="flex border-b border-border-color pb-2">
                            <div className="w-28 font-semibold text-text-secondary">Email</div>
                            <div className="font-medium">{user.email}</div>
                        </div>
                        <div className="flex border-b border-border-color pb-2">
                            <div className="w-28 font-semibold text-text-secondary">Role</div>
                            <div className="font-medium">{user.role}</div>
                        </div>
                        <div className="flex pb-2">
                            <div className="w-28 font-semibold text-text-secondary">Department</div>
                            <div className="font-medium">{user.department}</div>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default Header;