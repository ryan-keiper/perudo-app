import React, { useEffect, useState, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { AuthContext } from './auth-context';
import { getUserProfile, initializeUserProfile, updateUserActivity, type UserProfile } from '@/lib/firebase-user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = useCallback(async (firebaseUser: User) => {
    try {
      console.log('Loading profile for user:', firebaseUser.uid);
      let userProfile = await getUserProfile(firebaseUser.uid);
      
      // Initialize profile if it doesn't exist (first time user)
      if (!userProfile) {
        console.log('No profile found, creating new profile for:', firebaseUser.email);
        userProfile = await initializeUserProfile(
          firebaseUser.uid,
          firebaseUser.email || ''
        );
        console.log('Profile created:', userProfile);
      }
      
      setProfile(userProfile);
      
      // Update last active timestamp
      await updateUserActivity(firebaseUser.uid);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadUserProfile(user);
    }
  }, [user, loadUserProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        await loadUserProfile(firebaseUser);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe(); // cleanup on unmount
  }, [loadUserProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};