package com.divtechnosoft.videocall

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioDeviceInfo
import android.media.AudioFocusRequest
import android.media.AudioManager as AndroidAudioManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.telephony.PhoneStateListener
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL

class ReactNativeVideoCallModule : Module() {

  private var phoneStateListener: PhoneStateListener? = null
  private var telephonyCallback: TelephonyCallback? = null
  private var isObserving = false
  private var lastCallState = CallState.IDLE
  private val handler = Handler(Looper.getMainLooper())
  private var focusRequest: AudioFocusRequest? = null

  private enum class CallState {
    IDLE, RINGING, OFFHOOK
  }

  override fun definition() = ModuleDefinition {
    Name("ReactNativeVideoCall")

    Events("onPhoneCallStarted", "onPhoneCallEnded")

    // ─── Phone Call Detection ──────────────────────────────────

    AsyncFunction("startObservingPhoneCalls") {
      startCallObservation()
    }

    AsyncFunction("stopObservingPhoneCalls") {
      stopCallObservation()
    }

    Function("isCallDetectionAvailable") {
      val context = appContext.reactContext ?: return@Function false
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        context.checkSelfPermission(android.Manifest.permission.READ_PHONE_STATE) ==
          android.content.pm.PackageManager.PERMISSION_GRANTED
      } else {
        true
      }
    }

    // ─── Audio Routing ────────────────────────────────────────

    /**
     * Set MODE_IN_COMMUNICATION + request audio focus.
     * Call AFTER getUserMedia.
     */
    AsyncFunction("setCommunicationMode") {
      val context = appContext.reactContext ?: return@AsyncFunction null
      val am = context.getSystemService(Context.AUDIO_SERVICE) as? AndroidAudioManager
        ?: return@AsyncFunction null

      // Request audio focus FIRST — without it, setSpeakerphoneOn silently fails
      requestAudioFocus(am)

      // Set communication mode
      am.mode = AndroidAudioManager.MODE_IN_COMMUNICATION

      logAudioState("setCommunicationMode")
      null
    }

    /**
     * Force speaker on/off using the correct API per Android version.
     * Android 12+: setCommunicationDevice() (setSpeakerphoneOn is deprecated)
     * Older: setSpeakerphoneOn()
     *
     * MUST be called AFTER WebRTC finishes its audio setup.
     * The JS side calls this with a delay after getUserMedia and re-applies
     * on remote track arrival.
     */
    AsyncFunction("setSpeakerOn") { on: Boolean ->
      val context = appContext.reactContext ?: return@AsyncFunction null
      val am = context.getSystemService(Context.AUDIO_SERVICE) as? AndroidAudioManager
        ?: return@AsyncFunction null

      // Ensure we stay in communication mode with audio focus
      if (am.mode != AndroidAudioManager.MODE_IN_COMMUNICATION) {
        requestAudioFocus(am)
        am.mode = AndroidAudioManager.MODE_IN_COMMUNICATION
      }

      if (on) {
        routeToSpeaker(am)
      } else {
        routeToEarpiece(am)
      }

      logAudioState("setSpeakerOn($on)")
      null
    }

    /**
     * Reset audio to normal mode on call end.
     */
    AsyncFunction("resetAudio") {
      val context = appContext.reactContext ?: return@AsyncFunction null
      val am = context.getSystemService(Context.AUDIO_SERVICE) as? AndroidAudioManager
        ?: return@AsyncFunction null

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        am.clearCommunicationDevice()
      }
      @Suppress("DEPRECATION")
      am.isSpeakerphoneOn = false
      am.mode = AndroidAudioManager.MODE_NORMAL
      abandonAudioFocus(am)
      null
    }

    /**
     * Get current audio state for debugging.
     */
    Function("getAudioState") {
      val context = appContext.reactContext ?: return@Function mapOf<String, Any?>("error" to "no context")
      val am = context.getSystemService(Context.AUDIO_SERVICE) as? AndroidAudioManager
      mapOf(
        "mode" to when (am?.mode) {
          AndroidAudioManager.MODE_NORMAL -> "NORMAL"
          AndroidAudioManager.MODE_IN_CALL -> "IN_CALL"
          AndroidAudioManager.MODE_IN_COMMUNICATION -> "IN_COMMUNICATION"
          else -> "UNKNOWN(${am?.mode})"
        },
        "isSpeakerphoneOn" to (am?.isSpeakerphoneOn ?: false),
        "isWiredHeadsetOn" to (am?.isWiredHeadsetOn ?: false),
        "isBluetoothScoOn" to (am?.isBluetoothScoOn ?: false),
        "isMusicActive" to (am?.isMusicActive ?: false),
        "communicationDevice" to if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          am?.communicationDevice?.let { dev ->
            "${dev.productName} type=${dev.type}"
          } ?: "none"
        } else "N/A (pre-Android 12)"
      )
    }

    View(ReactNativeVideoCallView::class) {
      Prop("url") { view: ReactNativeVideoCallView, url: URL ->
        view.webView.loadUrl(url.toString())
      }
      Events("onLoad")
    }
  }

  // ─── Audio Focus ────────────────────────────────────────────

  private fun requestAudioFocus(am: AndroidAudioManager) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      if (focusRequest == null) {
        focusRequest = AudioFocusRequest.Builder(AndroidAudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
          .setAudioAttributes(
            AudioAttributes.Builder()
              .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
              .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
              .build()
          )
          .build()
      }
      focusRequest?.let { am.requestAudioFocus(it) }
    } else {
      @Suppress("DEPRECATION")
      am.requestAudioFocus(null, AndroidAudioManager.STREAM_VOICE_CALL, AndroidAudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
    }
  }

  private fun abandonAudioFocus(am: AndroidAudioManager) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      focusRequest?.let { am.abandonAudioFocusRequest(it) }
      focusRequest = null
    } else {
      @Suppress("DEPRECATION")
      am.abandonAudioFocus(null)
    }
  }

  // ─── Audio Routing ──────────────────────────────────────────

  private fun routeToSpeaker(am: AndroidAudioManager) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      // Android 12+: Use setCommunicationDevice — setSpeakerphoneOn is deprecated
      am.clearCommunicationDevice()
      val speakerDevice = am.availableCommunicationDevices
        .find { it.type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER }
      if (speakerDevice != null) {
        am.setCommunicationDevice(speakerDevice)
      } else {
        // Fallback to deprecated API if speaker device not found
        @Suppress("DEPRECATION")
        am.isSpeakerphoneOn = true
      }
    } else {
      @Suppress("DEPRECATION")
      am.isSpeakerphoneOn = true
    }
  }

  private fun routeToEarpiece(am: AndroidAudioManager) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      am.clearCommunicationDevice()
      val earpieceDevice = am.availableCommunicationDevices
        .find { it.type == AudioDeviceInfo.TYPE_BUILTIN_EARPIECE }
      if (earpieceDevice != null) {
        am.setCommunicationDevice(earpieceDevice)
      } else {
        @Suppress("DEPRECATION")
        am.isSpeakerphoneOn = false
      }
    } else {
      @Suppress("DEPRECATION")
      am.isSpeakerphoneOn = false
    }
  }

  // ─── Logging ────────────────────────────────────────────────

  private fun logAudioState(tag: String) {
    val context = appContext.reactContext ?: return
    val am = context.getSystemService(Context.AUDIO_SERVICE) as? AndroidAudioManager ?: return
    val modeStr = when (am.mode) {
      AndroidAudioManager.MODE_NORMAL -> "NORMAL"
      AndroidAudioManager.MODE_IN_CALL -> "IN_CALL"
      AndroidAudioManager.MODE_IN_COMMUNICATION -> "IN_COMMUNICATION"
      else -> "UNKNOWN"
    }
    val deviceStr = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      am.communicationDevice?.let { "${it.productName}(type=${it.type})" } ?: "none"
    } else {
      @Suppress("DEPRECATION")
      "speakerphone=${am.isSpeakerphoneOn}"
    }
    android.util.Log.d(
      "VideoCallAudio",
      "[$tag] mode=$modeStr device=$deviceStr wired=${am.isWiredHeadsetOn} bt=${am.isBluetoothScoOn}"
    )
  }

  // ─── Phone Call Detection ───────────────────────────────────

  private fun startCallObservation() {
    if (isObserving) return
    val context = appContext.reactContext ?: return
    isObserving = true
    lastCallState = CallState.IDLE
    startTelephonyObservation(context)
  }

  private fun stopCallObservation() {
    if (!isObserving) return
    val context = appContext.reactContext ?: return
    val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && telephonyCallback != null) {
      telephonyManager?.unregisterTelephonyCallback(telephonyCallback!!)
      telephonyCallback = null
    } else if (phoneStateListener != null) {
      telephonyManager?.listen(phoneStateListener, PhoneStateListener.LISTEN_NONE)
      phoneStateListener = null
    }
    isObserving = false
    lastCallState = CallState.IDLE
  }

  private fun startTelephonyObservation(context: Context) {
    val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager ?: return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      if (context.checkSelfPermission(android.Manifest.permission.READ_PHONE_STATE) !=
        android.content.pm.PackageManager.PERMISSION_GRANTED
      ) { return }
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val callback = object : TelephonyCallback(), TelephonyCallback.CallStateListener {
        override fun onCallStateChanged(state: Int) { handleCallState(state) }
      }
      telephonyCallback = callback
      telephonyManager.registerTelephonyCallback(context.mainExecutor, callback)
    } else {
      @Suppress("DEPRECATION")
      val listener = object : PhoneStateListener() {
        @Deprecated("Deprecated in API 31")
        override fun onCallStateChanged(state: Int, phoneNumber: String?) { handleCallState(state) }
      }
      phoneStateListener = listener
      @Suppress("DEPRECATION")
      telephonyManager.listen(listener, PhoneStateListener.LISTEN_CALL_STATE)
    }
  }

  private fun handleCallState(state: Int) {
    val newState = when (state) {
      TelephonyManager.CALL_STATE_RINGING -> CallState.RINGING
      TelephonyManager.CALL_STATE_OFFHOOK -> CallState.OFFHOOK
      TelephonyManager.CALL_STATE_IDLE -> CallState.IDLE
      else -> return
    }
    when {
      lastCallState == CallState.IDLE && (newState == CallState.RINGING || newState == CallState.OFFHOOK) -> {
        sendEvent("onPhoneCallStarted", mapOf("type" to "cellular"))
      }
      (lastCallState == CallState.RINGING || lastCallState == CallState.OFFHOOK) && newState == CallState.IDLE -> {
        sendEvent("onPhoneCallEnded", mapOf("type" to "cellular"))
      }
    }
    lastCallState = newState
  }
}
