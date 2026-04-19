package com.divtechnosoft.videocall

import android.content.Context
import android.os.Build
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

  private enum class CallState {
    IDLE, RINGING, OFFHOOK
  }

  override fun definition() = ModuleDefinition {
    Name("ReactNativeVideoCall")

    Events("onPhoneCallStarted", "onPhoneCallEnded")

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

    View(ReactNativeVideoCallView::class) {
      Prop("url") { view: ReactNativeVideoCallView, url: URL ->
        view.webView.loadUrl(url.toString())
      }
      Events("onLoad")
    }
  }

  private fun startCallObservation() {
    if (isObserving) return

    val context = appContext.reactContext ?: return
    isObserving = true
    lastCallState = CallState.IDLE

    // Use TelephonyManager to detect phone call state changes
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

    // Check if we have permission
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      if (context.checkSelfPermission(android.Manifest.permission.READ_PHONE_STATE) !=
        android.content.pm.PackageManager.PERMISSION_GRANTED
      ) {
        return
      }
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val callback = object : TelephonyCallback(), TelephonyCallback.CallStateListener {
        override fun onCallStateChanged(state: Int) {
          handleCallState(state)
        }
      }
      telephonyCallback = callback
      telephonyManager.registerTelephonyCallback(context.mainExecutor, callback)
    } else {
      @Suppress("DEPRECATION")
      val listener = object : PhoneStateListener() {
        @Deprecated("Deprecated in API 31")
        override fun onCallStateChanged(state: Int, phoneNumber: String?) {
          handleCallState(state)
        }
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
