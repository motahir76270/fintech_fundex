// hooks/useKeepAwakeFix.js
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as KeepAwake from 'expo-keep-awake';

export const useKeepAwakeFix = () => {
  useEffect(() => {
    let isMounted = true;
    
    const setupKeepAwake = async () => {
      try {
        // Only run on Android where the issue occurs
        if (Platform.OS === 'android') {
          // Deactivate keep awake to prevent the error
          await KeepAwake.deactivateKeepAwake();
        }
      } catch (error) {
        console.log('KeepAwake error handled:', error);
      }
    };
    
    if (isMounted) {
      setupKeepAwake();
    }
    
    return () => {
      isMounted = false;
    };
  }, []);
};