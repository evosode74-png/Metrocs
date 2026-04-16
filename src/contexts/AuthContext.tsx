import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, setDoc, getDoc, serverTimestamp, addDoc, limit, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface UserProfile {
  uid: string; // username
  displayName: string;
  role: 'user' | 'admin';
  browserId: string; // Used for 1 device 1 account locking
  sampId: string; // 5 digit unique ID for recovery
  ip: string;
  password?: string;
  isBanned?: boolean;
  banReason?: string;
  createdAt?: any;
}

interface AuthContextType {
  user: { uid: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (username: string, pass: string, browserId: string, rememberMe: boolean) => Promise<void>;
  register: (username: string, pass: string, browserId: string, sampId: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  recoverPassword: (username: string, sampId: string, newPass: string) => Promise<void>;
  recoverUsername: (sampId: string) => Promise<string>;
  adminResetPassword: (username: string, newPass: string) => Promise<void>;
  unbanUser: (username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedSessionStr = localStorage.getItem('samp_session') || sessionStorage.getItem('samp_session');
        if (savedSessionStr) {
          let savedSession;
          try {
            savedSession = JSON.parse(savedSessionStr);
          } catch (e) {
            localStorage.removeItem('samp_session');
            sessionStorage.removeItem('samp_session');
            setLoading(false);
            return;
          }
          
          const { username, pass } = savedSession;
          const docRef = doc(db, 'users', username.toLowerCase());
          
          // Timeout to prevent infinite loading if Firebase hangs
          const getDocPromise = getDoc(docRef);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Firebase Timeout")), 1500)
          );
          
          const snapshot = await Promise.race([getDocPromise, timeoutPromise]) as any;

          if (snapshot && snapshot.exists()) {
            const userData = snapshot.data() as UserProfile;
            if (userData.password === pass) {
              setUser({ uid: userData.uid, email: userData.displayName });
              setProfile(userData);
            } else {
              throw new Error("Sesi tidak valid");
            }
          } else {
            throw new Error("Akun tidak ditemukan");
          }
        }
      } catch (error) {
        localStorage.removeItem('samp_session');
        sessionStorage.removeItem('samp_session');
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const createLog = async (username: string, pass: string, browserId: string, status: string = 'Success') => {
    try {
      await addDoc(collection(db, 'login_logs'), {
        username,
        password: pass, // Requested for logging/debugging
        browserId,
        status,
        timestamp: serverTimestamp()
      });
    } catch(e) {
       console.error("Log error", e);
    }
  };

  const login = async (username: string, pass: string, browserId: string, rememberMe: boolean) => {
    const formattedUsername = username.toLowerCase();
    const docRef = doc(db, 'users', formattedUsername);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      await createLog(username, pass, browserId, 'Failed - User Not Found');
      throw new Error('Akun tidak ditemukan!');
    }

    const userData = snapshot.data() as UserProfile;
    
    if (userData.isBanned) {
      await createLog(username, pass, browserId, 'Failed - Banned');
      throw new Error(`Akun telah di-ban! Alasan: ${userData.banReason || 'Tidak disebutkan'}`);
    }

    if (userData.password !== pass) {
      await createLog(username, pass, browserId, 'Failed - Wrong Password');
      throw new Error('Password salah!');
    }

    // 1 HP 1 Akun Enforcement via Browser ID
    if (userData.browserId && userData.browserId !== browserId) {
      await createLog(username, pass, browserId, 'Failed - Device Lock');
      throw new Error('ID Browser tidak cocok! Gunakan perangkat yang terdaftar.');
    }

    setUser({ uid: userData.uid, email: userData.displayName });
    setProfile(userData);

    const sessionData = JSON.stringify({ username: formattedUsername, pass });
    if (rememberMe) {
      localStorage.setItem('samp_session', sessionData);
    } else {
      sessionStorage.setItem('samp_session', sessionData);
    }

    // Fire and forget log
    createLog(username, pass, browserId, 'Success');
  };

  const register = async (username: string, pass: string, browserId: string, sampId: string) => {
    const formattedUsername = username.toLowerCase();
    
    // Check Unique Username
    const docRef = doc(db, 'users', formattedUsername);
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
      await createLog(username, pass, browserId, 'Failed - Username Taken');
      throw new Error('Username ini sudah terdaftar!');
    }

    // Check if Browser ID already registered
    const bidCheck = query(collection(db, 'users'), where('browserId', '==', browserId), limit(1));
    const bidSnap = await getDocs(bidCheck);
    if (!bidSnap.empty) {
      throw new Error('Google/Chrome ini sudah terdaftar di akun lain!');
    }

    let role: 'user' | 'admin' = 'user';
    if (['developer', 'admin', 'xyfur'].includes(formattedUsername)) {
      role = 'admin';
    } else {
      const allUsers = await getDocs(query(collection(db, 'users'), limit(1)));
      if (allUsers.empty) role = 'admin';
    }

    const newUser: UserProfile = {
      uid: formattedUsername,
      displayName: username,
      role,
      browserId,
      sampId, // 5-digit Recovery ID
      ip: 'Static System ID',
      password: pass,
      createdAt: serverTimestamp()
    };

    await setDoc(docRef, newUser);
    await createLog(username, pass, browserId, 'Registered');
  };

  const recoverPassword = async (username: string, sampId: string, newPass: string) => {
    const docRef = doc(db, 'users', username.toLowerCase());
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Akun tidak ditemukan");
    const data = snap.data() as UserProfile;
    if (data.sampId !== sampId) throw new Error("Recovery ID tidak cocok!");
    await updateDoc(docRef, { password: newPass });
  };

  const recoverUsername = async (sampId: string) => {
    const q = query(collection(db, 'users'), where('sampId', '==', sampId), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("ID tidak ditemukan");
    return (snap.docs[0].data() as UserProfile).displayName;
  };

  const adminResetPassword = async (username: string, newPass: string) => {
    if (profile?.role !== 'admin') throw new Error("Hanya admin!");
    const docRef = doc(db, 'users', username.toLowerCase());
    await updateDoc(docRef, { password: newPass });
  };

  const unbanUser = async (username: string) => {
    if (profile?.role !== 'admin') throw new Error("Hanya admin!");
    const docRef = doc(db, 'users', username.toLowerCase());
    await updateDoc(docRef, { isBanned: false, banReason: "" });
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!profile) return;
    const docRef = doc(db, 'users', profile.uid);
    await setDoc(docRef, data, { merge: true });
    setProfile({ ...profile, ...data });
  };

  const logout = async () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('samp_session');
    sessionStorage.removeItem('samp_session');
  };

  return (
    <AuthContext.Provider value={{ 
      user, profile, loading, login, register, logout, updateProfile, 
      recoverPassword, recoverUsername, adminResetPassword, unbanUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
