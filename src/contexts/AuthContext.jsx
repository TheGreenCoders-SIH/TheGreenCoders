import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getUserRole, generateFarmerId, ROLES, ADMIN_PHONE_NUMBERS } from '../lib/roles';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Mock User Generator
    const createMockUser = (uid, data) => ({
        uid: uid,
        email: data.email || `${data.phoneNumber}@greencoders.com`, // Fake email for compatibility
        displayName: data.name || 'Farmer',
    });

    // 1. Initialize Session on Load
    useEffect(() => {
        const initializeAuth = async () => {
            const storedUid = localStorage.getItem('green_coders_uid');

            if (storedUid) {
                try {
                    // Try to fetch user from DB
                    const userRef = doc(db, 'users', storedUid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        const profile = userSnap.data();

                        // Dev Backdoor: If phone number is admin, force role
                        if (ADMIN_PHONE_NUMBERS.includes(profile.phoneNumber)) {
                            profile.role = ROLES.ADMIN;
                        }

                        setUserProfile(profile);
                        setCurrentUser(createMockUser(storedUid, profile));
                    } else {
                        // Invalid session, clear it
                        localStorage.removeItem('green_coders_uid');
                    }
                } catch (error) {
                    console.error("Session restore error:", error);
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const logout = async () => {
        localStorage.removeItem('green_coders_uid');
        setCurrentUser(null);
        setUserProfile(null);
        // Note: We don't need signOut(auth) anymore as we aren't using Firebase Auth
    };

    const loginAsGuest = async () => {
        try {
            const guestUid = 'guest-mode-user';
            const guestProfile = {
                email: 'guest@greencoders.com',
                role: 'guest',
                farmerId: 'GUEST-MODE',
                name: 'Guest User',
                createdAt: new Date().toISOString(),
                uid: guestUid
            };

            // For guest, we usually don't persist to DB to keep it clean, 
            // but we can if we want to default behaviors. 
            // Let's just set state and storage.

            // Actually, let's not persist guest to localStorage to avoid stuck guest sessions
            // localStorage.setItem('green_coders_uid', guestUid);

            setCurrentUser(createMockUser(guestUid, guestProfile));
            setUserProfile(guestProfile);
            return { success: true };
        } catch (error) {
            console.error("Guest login error:", error);
            return { success: false, error: error.message };
        }
    };

    const loginWithQR = (data) => {
        const uid = data.userId || 'qr-user-' + Date.now();
        const qrUser = {
            uid: uid,
            email: data.email,
        };
        const qrProfile = {
            email: data.email,
            role: ROLES.FARMER,
            farmerId: data.farmerId,
            userId: uid
        };

        localStorage.setItem('green_coders_uid', uid);
        setCurrentUser(qrUser);
        setUserProfile(qrProfile);
    };

    // Check if phone number is registered
    const checkPhoneExists = async (phoneNumber) => {
        const q = query(collection(db, 'users'), where('phoneNumber', '==', phoneNumber));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    };

    // 1. Updated Login Function (Custom Auth)
    const loginWithPhone = async (phoneNumber) => {
        try {
            const q = query(collection(db, 'users'), where('phoneNumber', '==', phoneNumber));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                // If it's the admin number but doesn't exist, we can't login, they must signup.
                // Or we could auto-create? Better to stick to standard flow: Signup first.
                throw new Error('User not found. Please sign up first.');
            }

            const docSnap = querySnapshot.docs[0];
            const profile = docSnap.data();
            const uid = docSnap.id;

            // Dev Backdoor: Override role if it's an admin number
            if (ADMIN_PHONE_NUMBERS.includes(phoneNumber)) {
                profile.role = ROLES.ADMIN;
            }

            // Persist Session
            localStorage.setItem('green_coders_uid', uid);

            setUserProfile(profile);
            setCurrentUser(createMockUser(uid, profile));

            return { success: true };
        } catch (error) {
            console.error("Login error:", error);
            return { success: false, error: error.message };
        }
    };

    // 2. Updated Signup Function (Custom Auth)
    const signupWithPhone = async (name, phoneNumber) => {
        try {
            const exists = await checkPhoneExists(phoneNumber);
            if (exists) {
                throw new Error('Phone number already registered. Please login.');
            }

            // Create a custom UID
            const uid = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const farmerId = generateFarmerId();

            // Check if this should be an admin
            const role = ADMIN_PHONE_NUMBERS.includes(phoneNumber) ? ROLES.ADMIN : ROLES.FARMER;

            const profile = {
                name: name,
                phoneNumber: phoneNumber,
                role: role,
                farmerId: farmerId,
                hasCard: false,
                createdAt: new Date().toISOString(),
                uid: uid
            };

            // Save to Firestore
            await setDoc(doc(db, 'users', uid), profile);

            // Persist Session
            localStorage.setItem('green_coders_uid', uid);

            setUserProfile(profile);
            setCurrentUser(createMockUser(uid, profile)); // Ensure we set currentUser too


            return { success: true };
        } catch (error) {
            console.error("Signup error:", error);
            return { success: false, error: error.message };
        }
    };


    const value = {
        currentUser,
        userProfile,
        logout,
        loginAsGuest,
        loginWithQR,
        checkPhoneExists,
        loginWithPhone,
        signupWithPhone,
        isAdmin: userProfile?.role === ROLES.ADMIN,
        isFarmer: userProfile?.role === ROLES.FARMER,
        isNGO: userProfile?.role === ROLES.NGO,
        isGuest: userProfile?.role === 'guest'
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
