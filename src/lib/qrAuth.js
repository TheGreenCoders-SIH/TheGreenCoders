// QR Code Authentication System
// Handles QR code generation and scanning for farmer login

import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// Generate encrypted QR data for farmer card
export const generateQRData = (farmerData) => {
    const qrPayload = {
        type: 'farmer_login',
        farmerId: farmerData.farmerId,
        email: farmerData.email,
        timestamp: new Date().toISOString(),
        version: '1.0'
    };

    // In production, encrypt this data
    return JSON.stringify(qrPayload);
};

// Parse QR code data
export const parseQRData = (qrString) => {
    try {
        // Try to parse as JSON first (legacy/rich format)
        let data;
        let isJson = false;
        try {
            data = JSON.parse(qrString);
            isJson = true;
        } catch (e) {
            // Not JSON, treat as raw string
        }

        if (isJson) {
            if (data.type === 'farmer_login') {
                // Verify timestamp (QR code valid for 30 days)
                const qrDate = new Date(data.timestamp);
                const daysSinceCreation = (Date.now() - qrDate.getTime()) / (1000 * 60 * 60 * 24);

                if (daysSinceCreation > 30) {
                    throw new Error('QR code expired. Please generate a new card.');
                }

                return {
                    farmerId: data.farmerId,
                    email: data.email,
                    valid: true
                };
            } else if (data.farmerId) {
                // Simple JSON with farmerId
                return {
                    farmerId: data.farmerId,
                    email: data.email, // Optional
                    valid: true
                };
            }
        }

        // Check if raw string matches FarmerID format
        // FC-YYYY-XXXXXX
        const farmerIdPattern = /^FC-\d{4}-\d{6}$/;
        if (farmerIdPattern.test(qrString)) {
            return {
                farmerId: qrString,
                valid: true
            };
        }

        throw new Error('Invalid QR code format');
    } catch (error) {
        console.error('QR parse error:', error);
        return {
            valid: false,
            error: error.message
        };
    }
}


// Authenticate farmer using QR code data
export const authenticateWithQR = async (qrData) => {
    try {
        const parsedData = parseQRData(qrData);

        if (!parsedData.valid) {
            throw new Error(parsedData.error || 'Invalid QR code');
        }

        // Fetch farmer data from Firestore
        const farmerRef = doc(db, 'farmers', parsedData.farmerId);
        const farmerSnap = await getDoc(farmerRef);

        if (!farmerSnap.exists()) {
            throw new Error('Farmer not found in database');
        }

        const farmerData = farmerSnap.data();

        // Get user data to find email
        const userRef = doc(db, 'users', farmerData.userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error('User account not found');
        }

        return {
            success: true,
            farmerId: parsedData.farmerId,
            userId: farmerData.userId,
            email: userSnap.data().email,
            message: 'QR code verified successfully'
        };
    } catch (error) {
        console.error('QR authentication error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Validate RFID/UID input
export const validateUID = (uid) => {
    // UID format: FC-2025-XXXXXX
    const uidPattern = /^FC-2025-\d{6}$/;
    return uidPattern.test(uid);
};

// Authenticate with UID
export const authenticateWithUID = async (uid) => {
    try {
        if (!validateUID(uid)) {
            throw new Error('Invalid UID format. Expected: FC-2025-XXXXXX');
        }

        // Fetch farmer data
        const farmerRef = doc(db, 'farmers', uid);
        const farmerSnap = await getDoc(farmerRef);

        if (!farmerSnap.exists()) {
            throw new Error('Farmer ID not found');
        }

        const farmerData = farmerSnap.data();

        // Get user data
        const userRef = doc(db, 'users', farmerData.userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error('User account not found');
        }

        return {
            success: true,
            farmerId: uid,
            userId: farmerData.userId,
            email: userSnap.data().email,
            message: 'UID verified successfully'
        };
    } catch (error) {
        console.error('UID authentication error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Check camera permissions
export const checkCameraPermission = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return { granted: true };
    } catch (error) {
        return {
            granted: false,
            error: error.name === 'NotAllowedError'
                ? 'Camera permission denied'
                : 'Camera not available'
        };
    }
};
