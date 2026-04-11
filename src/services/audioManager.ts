/**
 * AudioManager - Handles audio routing for video calls
 *
 * Ensures audio plays through the correct speaker:
 * - Video calls: Loudspeaker (speakerphone)
 * - Audio calls: Earpiece
 * - Handles Bluetooth/wired headset connections
 */

import { Platform, NativeModules, NativeEventEmitter, AppState, AppStateStatus } from 'react-native';

const { WebRTCModule } = NativeModules;

export type AudioDevice = 'speaker' | 'earpiece' | 'bluetooth' | 'wired-headset';
export type AudioMode = 'video-call' | 'voice-call';

interface AudioManagerState {
  currentDevice: AudioDevice;
  availableDevices: AudioDevice[];
  isSpeakerEnabled: boolean;
  appState: AppStateStatus;
}

type DeviceChangeListener = (device: AudioDevice) => void;

class AudioManagerService {
  private state: AudioManagerState = {
    currentDevice: 'earpiece',
    availableDevices: ['earpiece', 'speaker'],
    isSpeakerEnabled: false,
    appState: 'active',
  };

  private eventEmitter: NativeEventEmitter | null = null;
  private deviceChangeListeners: DeviceChangeListener[] = [];
  private appStateSubscription: any = null;
  private isInitialized = false;

  /**
   * Initialize audio for a video call
   * Sets up speakerphone mode and listeners
   */
  async initialize(mode: AudioMode = 'video-call'): Promise<void> {
    if (this.isInitialized) {
      console.log('[AudioManager] Already initialized');
      return;
    }

    console.log('[AudioManager] Initializing for mode:', mode);

    try {
      // Set up app state listener (for handling interruptions)
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

      // Set up audio device change listener
      this.setupDeviceChangeListener();

      // Configure audio session based on mode
      if (mode === 'video-call') {
        await this.enableSpeaker();
      } else {
        await this.disableSpeaker();
      }

      // Set audio mode on Android
      if (Platform.OS === 'android') {
        await this.setAndroidAudioMode(mode);
      }

      // Set audio session on iOS
      if (Platform.OS === 'ios') {
        await this.setIOSAudioSession(mode);
      }

      this.isInitialized = true;
      console.log('[AudioManager] Initialized successfully');
    } catch (error) {
      console.error('[AudioManager] Failed to initialize:', error);
      // Try to set speaker anyway for video calls
      if (mode === 'video-call') {
        await this.enableSpeaker();
      }
    }
  }

  /**
   * Clean up audio configuration
   */
  async cleanup(): Promise<void> {
    console.log('[AudioManager] Cleaning up');

    try {
      // Remove listeners
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
      }

      if (this.eventEmitter) {
        this.eventEmitter = null;
      }

      this.deviceChangeListeners = [];

      // Reset audio to normal mode
      if (Platform.OS === 'android') {
        await this.resetAndroidAudio();
      }

      if (Platform.OS === 'ios') {
        await this.resetIOSAudio();
      }

      this.isInitialized = false;
      console.log('[AudioManager] Cleanup complete');
    } catch (error) {
      console.error('[AudioManager] Cleanup error:', error);
    }
  }

  /**
   * Enable speakerphone (loudspeaker)
   */
  async enableSpeaker(): Promise<void> {
    console.log('[AudioManager] Enabling speaker');

    try {
      if (Platform.OS === 'android') {
        // Use WebRTC module to set speaker on
        if (WebRTCModule?.setSpeakerphoneOn) {
          await WebRTCModule.setSpeakerphoneOn(true);
        }
      }

      if (Platform.OS === 'ios') {
        // Use WebRTC module to set audio route
        if (WebRTCModule?.setAudioOutput) {
          await WebRTCModule.setAudioOutput('speaker');
        }
      }

      this.state.isSpeakerEnabled = true;
      this.state.currentDevice = 'speaker';
      this.notifyDeviceChange('speaker');
    } catch (error) {
      console.error('[AudioManager] Failed to enable speaker:', error);
    }
  }

  /**
   * Disable speakerphone (use earpiece)
   */
  async disableSpeaker(): Promise<void> {
    console.log('[AudioManager] Disabling speaker');

    try {
      if (Platform.OS === 'android') {
        if (WebRTCModule?.setSpeakerphoneOn) {
          await WebRTCModule.setSpeakerphoneOn(false);
        }
      }

      if (Platform.OS === 'ios') {
        if (WebRTCModule?.setAudioOutput) {
          await WebRTCModule.setAudioOutput('earpiece');
        }
      }

      this.state.isSpeakerEnabled = false;
      this.state.currentDevice = 'earpiece';
      this.notifyDeviceChange('earpiece');
    } catch (error) {
      console.error('[AudioManager] Failed to disable speaker:', error);
    }
  }

  /**
   * Toggle speaker on/off
   */
  async toggleSpeaker(): Promise<boolean> {
    if (this.state.isSpeakerEnabled) {
      await this.disableSpeaker();
    } else {
      await this.enableSpeaker();
    }
    return this.state.isSpeakerEnabled;
  }

  /**
   * Get current speaker state
   */
  isSpeakerEnabled(): boolean {
    return this.state.isSpeakerEnabled;
  }

  /**
   * Get current audio device
   */
  getCurrentDevice(): AudioDevice {
    return this.state.currentDevice;
  }

  /**
   * Add listener for audio device changes
   */
  onDeviceChange(listener: DeviceChangeListener): () => void {
    this.deviceChangeListeners.push(listener);
    return () => {
      const index = this.deviceChangeListeners.indexOf(listener);
      if (index > -1) {
        this.deviceChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Handle app state changes (background/foreground)
   */
  private handleAppStateChange = async (nextAppState: AppStateStatus): Promise<void> => {
    console.log('[AudioManager] App state changed:', nextAppState);

    const previousState = this.state.appState;
    this.state.appState = nextAppState;

    // Coming back to foreground - re-enable speaker if it was on
    if (previousState === 'background' && nextAppState === 'active') {
      if (this.state.isSpeakerEnabled) {
        // Small delay to let audio system settle
        setTimeout(() => {
          this.enableSpeaker();
        }, 100);
      }
    }
  };

  /**
   * Set up listener for audio device changes (Bluetooth, headset, etc.)
   */
  private setupDeviceChangeListener(): void {
    try {
      if (WebRTCModule) {
        this.eventEmitter = new NativeEventEmitter(WebRTCModule);

        // Listen for audio device changes
        this.eventEmitter.addListener('AudioDeviceChanged', (event: { device: AudioDevice }) => {
          console.log('[AudioManager] Audio device changed:', event.device);
          this.state.currentDevice = event.device;
          this.notifyDeviceChange(event.device);
        });
      }
    } catch (error) {
      console.log('[AudioManager] Could not set up device change listener');
    }
  }

  /**
   * Configure Android audio mode
   */
  private async setAndroidAudioMode(mode: AudioMode): Promise<void> {
    try {
      if (WebRTCModule?.setAudioMode) {
        await WebRTCModule.setAudioMode(mode === 'video-call' ? 'inCommunication' : 'inCall');
      }
    } catch (error) {
      console.error('[AudioManager] Failed to set Android audio mode:', error);
    }
  }

  /**
   * Configure iOS audio session
   */
  private async setIOSAudioSession(mode: AudioMode): Promise<void> {
    try {
      if (WebRTCModule?.setAudioSession) {
        await WebRTCModule.setAudioSession({
          category: 'playAndRecord',
          mode: mode === 'video-call' ? 'videoChat' : 'voiceChat',
          options: ['allowBluetooth', 'allowBluetoothA2DP', 'defaultToSpeaker'],
        });
      }
    } catch (error) {
      console.error('[AudioManager] Failed to set iOS audio session:', error);
    }
  }

  /**
   * Reset Android audio to normal
   */
  private async resetAndroidAudio(): Promise<void> {
    try {
      if (WebRTCModule?.setSpeakerphoneOn) {
        await WebRTCModule.setSpeakerphoneOn(false);
      }
      if (WebRTCModule?.setAudioMode) {
        await WebRTCModule.setAudioMode('normal');
      }
    } catch (error) {
      console.error('[AudioManager] Failed to reset Android audio:', error);
    }
  }

  /**
   * Reset iOS audio session
   */
  private async resetIOSAudio(): Promise<void> {
    try {
      if (WebRTCModule?.setAudioSession) {
        await WebRTCModule.setAudioSession({
          category: 'soloAmbient',
          mode: 'default',
          options: [],
        });
      }
    } catch (error) {
      console.error('[AudioManager] Failed to reset iOS audio session:', error);
    }
  }

  /**
   * Notify all listeners of device change
   */
  private notifyDeviceChange(device: AudioDevice): void {
    this.deviceChangeListeners.forEach((listener) => {
      try {
        listener(device);
      } catch (error) {
        console.error('[AudioManager] Listener error:', error);
      }
    });
  }
}

// Export singleton instance
export const AudioManager = new AudioManagerService();
