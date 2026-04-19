/**
 * AudioManager - Audio routing for video calls
 *
 * Directly controls Android/iOS audio routing via native module.
 *
 * Key insight: WebRTC's libwebrtc has its own internal audio manager that
 * overrides Android AudioManager settings. It calls setSpeakerphoneOn(false)
 * when audio starts, when audio focus changes, and when proximity sensor fires.
 *
 * Strategy: Set our routing AFTER WebRTC finishes its setup, and RE-APPLY
 * whenever a remote track arrives or connection state changes.
 */

export type AudioMode = 'video-call' | 'voice-call';

// Lazy-load native module
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

class AudioManagerService {
  private isSpeakerOn = false;
  private isInitialized = false;

  /**
   * Initialize AFTER getUserMedia.
   * Requests audio focus, sets MODE_IN_COMMUNICATION, and routes to speaker.
   */
  async initialize(mode: AudioMode = 'video-call'): Promise<void> {
    if (this.isInitialized) {
      console.log('[AudioManager] Already initialized');
      return;
    }

    console.log('[AudioManager] Initializing, mode:', mode);

    try {
      const nativeModule = getNativeModule();
      if (!nativeModule?.setCommunicationMode) {
        console.warn('[AudioManager] Native audio module not available');
        return;
      }

      this.isSpeakerOn = mode === 'video-call';

      // Step 1: Request audio focus + set communication mode
      await nativeModule.setCommunicationMode();

      // Step 2: Wait for WebRTC's internal audio setup to complete.
      // libwebrtc calls setSpeakerphoneOn(false) during this phase,
      // so we must apply our routing AFTER it finishes.
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Route audio (this may get overridden by WebRTC again,
      // but reapplyRoute() will fix it when remote track arrives)
      if (nativeModule.setSpeakerOn) {
        await nativeModule.setSpeakerOn(this.isSpeakerOn);
      } else {
        console.warn('[AudioManager] setSpeakerOn not available on native module');
      }

      this.isInitialized = true;
      console.log('[AudioManager] Initialized, speaker:', this.isSpeakerOn);
      await this.logState('initialize');
    } catch (error) {
      console.error('[AudioManager] Initialize failed:', error);
    }
  }

  /**
   * Re-apply current audio route. CRITICAL: Call this when remote stream
   * arrives — libwebrtc resets routing when remote audio track activates.
   *
   * This is the most important call. WebRTC overrides speaker settings
   * internally, so we must re-apply AFTER it's done.
   */
  async reapplyRoute(): Promise<void> {
    if (!this.isInitialized) return;
    console.log('[AudioManager] Re-applying route, speaker:', this.isSpeakerOn);
    try {
      const nativeModule = getNativeModule();
      if (nativeModule?.setSpeakerOn) {
        // Small delay to let WebRTC's audio layer settle after track event
        await new Promise(resolve => setTimeout(resolve, 100));
        await nativeModule.setSpeakerOn(this.isSpeakerOn);
      }
      await this.logState('reapply');
    } catch (error) {
      console.error('[AudioManager] Re-apply failed:', error);
    }
  }

  /**
   * Toggle speaker <-> earpiece
   */
  async toggleSpeaker(): Promise<boolean> {
    if (!this.isInitialized) return this.isSpeakerOn;

    this.isSpeakerOn = !this.isSpeakerOn;
    try {
      const nativeModule = getNativeModule();
      if (nativeModule?.setSpeakerOn) {
        await nativeModule.setSpeakerOn(this.isSpeakerOn);
      }
      console.log('[AudioManager] Toggled speaker:', this.isSpeakerOn);
      await this.logState('toggle');
    } catch (error) {
      console.error('[AudioManager] Toggle failed:', error);
    }
    return this.isSpeakerOn;
  }

  /**
   * Stop audio management, reset to normal
   */
  async cleanup(): Promise<void> {
    console.log('[AudioManager] Cleanup');
    try {
      const nativeModule = getNativeModule();
      if (nativeModule?.resetAudio) {
        await nativeModule.resetAudio();
      }
      this.isInitialized = false;
      this.isSpeakerOn = false;
    } catch (error) {
      console.error('[AudioManager] Cleanup failed:', error);
      this.isInitialized = false;
      this.isSpeakerOn = false;
    }
  }

  getIsSpeakerOn(): boolean {
    return this.isSpeakerOn;
  }

  private async logState(tag: string): Promise<void> {
    try {
      const nativeModule = getNativeModule();
      if (nativeModule?.getAudioState) {
        const state = nativeModule.getAudioState();
        console.log(`[AudioManager] ${tag}:`, JSON.stringify(state));
      }
    } catch { /* ignore */ }
  }
}

export const AudioManager = new AudioManagerService();
