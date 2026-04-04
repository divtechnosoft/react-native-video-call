/**
 * usePermissions Hook - Handle camera and microphone permissions
 */

import { useState, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { PermissionState } from '../types';

export function usePermissions() {
  const [state, setState] = useState<PermissionState>({
    hasCamera: false,
    hasMicrophone: false,
    isRequesting: false,
    error: null,
  });

  // Request camera and microphone permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isRequesting: true, error: null }));

    try {
      if (Platform.OS === 'android') {
        // Android permission request
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        const hasCamera = results['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED;
        const hasMicrophone = results['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED;

        setState({
          hasCamera,
          hasMicrophone,
          isRequesting: false,
          error: (!hasCamera || !hasMicrophone) ? 'Some permissions were denied' : null,
        });

        return hasCamera && hasMicrophone;
      } else {
        // iOS - permissions are requested automatically by mediaDevices.getUserMedia
        // We'll check after requesting media
        setState({
          hasCamera: true,
          hasMicrophone: true,
          isRequesting: false,
          error: null,
        });

        return true;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request permissions';
      setState((prev) => ({
        ...prev,
        isRequesting: false,
        error: errorMessage,
      }));

      return false;
    }
  }, []);

  // Check current permission status
  const checkPermissions = useCallback(async (): Promise<PermissionState> => {
    if (Platform.OS === 'android') {
      const cameraPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      const microphonePermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);

      const newState: PermissionState = {
        hasCamera: cameraPermission,
        hasMicrophone: microphonePermission,
        isRequesting: false,
        error: null,
      };

      setState(newState);
      return newState;
    }

    // iOS - assume granted (actual check happens via getUserMedia)
    return state;
  }, [state]);

  return {
    ...state,
    requestPermissions,
    checkPermissions,
  };
}
