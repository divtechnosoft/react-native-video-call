/**
 * usePhoneCallDetection - Detects cellular phone calls and audio interruptions
 *
 * Bridges native CXCallObserver (iOS) / TelephonyManager (Android)
 * events to React state and callbacks.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { PhoneCallEvent, PhoneCallEventType } from '../types';

// Grace period: ignore events that fire within this duration after
// starting observation. Prevents false positives from WebRTC's CallKit
// call (iOS) or audio session setup changes.
const GRACE_PERIOD_MS = 2000;

// Startup delay: wait this long after the hook is enabled before calling
// the native module's startObservingPhoneCalls(). This lets the WebRTC
// connection stabilize first and prevents the native observer from
// interfering with the audio session during call setup.
const STARTUP_DELAY_MS = 5000;

// Debounce: ignore phone call ended events if call lasted less than this
const ENDED_DEBOUNCE_MS = 300;

export interface UsePhoneCallDetectionOptions {
  enabled: boolean;
  onPhoneCallStarted?: (event: PhoneCallEvent) => void;
  onPhoneCallEnded?: (event: PhoneCallEvent) => void;
}

export interface UsePhoneCallDetectionReturn {
  isPhoneCallActive: boolean;
  phoneCallType: PhoneCallEventType | null;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

// Check if the native module supports phone call detection
function supportsPhoneCallDetection(nativeModule: any): boolean {
  return !!(
    nativeModule &&
    typeof nativeModule.startObservingPhoneCalls === 'function' &&
    typeof nativeModule.addListener === 'function'
  );
}

// Lazy-load the native module to avoid crashes on web
let _nativeModule: any = null;
function getNativeModule(): any {
  if (_nativeModule !== null) return _nativeModule;
  try {
    const { requireNativeModule } = require('expo-modules-core');
    _nativeModule = requireNativeModule('ReactNativeVideoCall');
  } catch {
    _nativeModule = null;
  }
  return _nativeModule;
}

export function usePhoneCallDetection({
  enabled,
  onPhoneCallStarted,
  onPhoneCallEnded,
}: UsePhoneCallDetectionOptions): UsePhoneCallDetectionReturn {
  const [isPhoneCallActive, setIsPhoneCallActive] = useState(false);
  const [phoneCallType, setPhoneCallType] = useState<PhoneCallEventType | null>(null);
  const [hasPermission, setHasPermission] = useState(Platform.OS === 'ios');

  const observationStartedAtRef = useRef<number>(0);
  const startedAtRef = useRef<number>(0);
  const endedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync with callbacks to avoid stale closures
  const onPhoneCallStartedRef = useRef(onPhoneCallStarted);
  onPhoneCallStartedRef.current = onPhoneCallStarted;

  const onPhoneCallEndedRef = useRef(onPhoneCallEnded);
  onPhoneCallEndedRef.current = onPhoneCallEnded;

  // Request READ_PHONE_STATE permission on Android
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        {
          title: 'Phone State Permission',
          message: 'This app needs access to phone state to detect incoming calls during video calls.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      const result = granted === PermissionsAndroid.RESULTS.GRANTED;
      setHasPermission(result);
      return result;
    } catch {
      return false;
    }
  }, []);

  // Check permission on mount (Android only)
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const checkPermission = async () => {
      try {
        const result = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE
        );
        setHasPermission(result);
      } catch {
        // Permission check failed, not critical
      }
    };
    checkPermission();
  }, []);

  // Main effect: start/stop observation based on `enabled`
  useEffect(() => {
    if (!enabled) return;

    const nativeModule = getNativeModule();

    // Bail out early if native module doesn't support phone call detection
    if (!supportsPhoneCallDetection(nativeModule)) {
      return;
    }

    let startedSubscription: any = null;
    let endedSubscription: any = null;
    let isCleanedUp = false;

    const start = async () => {
      try {
        // Delay starting observation to let WebRTC connection stabilize
        await new Promise(resolve => setTimeout(resolve, STARTUP_DELAY_MS));

        // If cleanup happened while we were waiting, bail out
        if (isCleanedUp) return;

        // Start observing on the native side
        await nativeModule.startObservingPhoneCalls();

        // If cleanup happened while starting, bail out
        if (isCleanedUp) {
          try { nativeModule.stopObservingPhoneCalls(); } catch {}
          return;
        }

        // Record when observation started for grace period
        observationStartedAtRef.current = Date.now();

        // Subscribe to events — wrap each listener in its own try-catch
        // so a crash in one doesn't affect the other or the component
        try {
          startedSubscription = nativeModule.addListener(
            'onPhoneCallStarted',
            (event: { type: PhoneCallEventType; callId?: string }) => {
              try {
                // Grace period: ignore events right after starting observation
                const timeSinceStart = Date.now() - observationStartedAtRef.current;
                if (timeSinceStart < GRACE_PERIOD_MS) {
                  console.log('[usePhoneCallDetection] Ignoring start (grace period)', timeSinceStart, 'ms');
                  return;
                }

                // Cancel any pending ended debounce
                if (endedTimerRef.current) {
                  clearTimeout(endedTimerRef.current);
                  endedTimerRef.current = null;
                }

                startedAtRef.current = Date.now();
                setIsPhoneCallActive(true);
                setPhoneCallType(event.type);
                onPhoneCallStartedRef.current?.(event);
              } catch (error) {
                console.error('[usePhoneCallDetection] Error in started handler:', error);
              }
            }
          );
        } catch (error) {
          console.error('[usePhoneCallDetection] Failed to add started listener:', error);
        }

        try {
          endedSubscription = nativeModule.addListener(
            'onPhoneCallEnded',
            (event: { type: PhoneCallEventType; callId?: string }) => {
              try {
                // Grace period check
                const timeSinceStart = Date.now() - observationStartedAtRef.current;
                if (timeSinceStart < GRACE_PERIOD_MS) {
                  console.log('[usePhoneCallDetection] Ignoring end (grace period)');
                  return;
                }

                // Debounce: ignore if call lasted less than ENDED_DEBOUNCE_MS
                const elapsed = Date.now() - startedAtRef.current;
                if (elapsed < ENDED_DEBOUNCE_MS) {
                  setIsPhoneCallActive(false);
                  setPhoneCallType(null);
                  return;
                }

                if (endedTimerRef.current) {
                  clearTimeout(endedTimerRef.current);
                }

                endedTimerRef.current = setTimeout(() => {
                  if (!isCleanedUp) {
                    setIsPhoneCallActive(false);
                    setPhoneCallType(null);
                    onPhoneCallEndedRef.current?.(event);
                  }
                  endedTimerRef.current = null;
                }, 100);
              } catch (error) {
                console.error('[usePhoneCallDetection] Error in ended handler:', error);
              }
            }
          );
        } catch (error) {
          console.error('[usePhoneCallDetection] Failed to add ended listener:', error);
        }
      } catch (error) {
        console.error('[usePhoneCallDetection] Failed to start:', error);
      }
    };

    const stop = () => {
      isCleanedUp = true;

      try {
        startedSubscription?.remove();
      } catch { /* ignore */ }

      try {
        endedSubscription?.remove();
      } catch { /* ignore */ }

      try {
        if (nativeModule?.stopObservingPhoneCalls) {
          nativeModule.stopObservingPhoneCalls();
        }
      } catch { /* ignore */ }

      if (endedTimerRef.current) {
        clearTimeout(endedTimerRef.current);
        endedTimerRef.current = null;
      }
    };

    start();

    return () => {
      stop();
    };
  }, [enabled]);

  return {
    isPhoneCallActive,
    phoneCallType,
    hasPermission,
    requestPermission,
  };
}
