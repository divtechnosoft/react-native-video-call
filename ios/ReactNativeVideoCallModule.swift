import ExpoModulesCore
import CallKit
import AVFoundation

// Separate NSObject class for CXCallObserverDelegate since Expo Module
// classes don't inherit from NSObject and can't conform to NSObjectProtocol
private class PhoneCallDelegate: NSObject, CXCallObserverDelegate {
  private let onCallStarted: (String) -> Void
  private let onCallEnded: (String) -> Void
  private var activeCallUUIDs: Set<UUID> = []

  init(onCallStarted: @escaping (String) -> Void, onCallEnded: @escaping (String) -> Void) {
    self.onCallStarted = onCallStarted
    self.onCallEnded = onCallEnded
    super.init()
  }

  func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) {
    let wasAlreadyTracked = activeCallUUIDs.contains(call.uuid)

    if call.hasConnected && !call.isOnHold && !call.hasEnded {
      if !wasAlreadyTracked {
        let wasEmpty = activeCallUUIDs.isEmpty
        activeCallUUIDs.insert(call.uuid)

        if wasEmpty {
          onCallStarted(call.uuid.uuidString)
        }
      }
    }

    if call.hasEnded {
      activeCallUUIDs.remove(call.uuid)

      if activeCallUUIDs.isEmpty {
        onCallEnded(call.uuid.uuidString)
      }
    }
  }

  func snapshotExistingCalls(_ observer: CXCallObserver) {
    for call in observer.calls {
      if call.hasConnected && !call.hasEnded {
        activeCallUUIDs.insert(call.uuid)
      }
    }
  }
}

public class ReactNativeVideoCallModule: Module {
  private var callObserver: CXCallObserver?
  private var callDelegate: PhoneCallDelegate?
  private var interruptionObserver: Any?
  private var isInterruptionActive = false

  public func definition() -> ModuleDefinition {
    Name("ReactNativeVideoCall")

    Events("onPhoneCallStarted", "onPhoneCallEnded")

    AsyncFunction("startObservingPhoneCalls") {
      startCallObservation()
    }

    AsyncFunction("stopObservingPhoneCalls") {
      stopCallObservation()
    }

    Function("isCallDetectionAvailable") {
      return true
    }

    View(ReactNativeVideoCallView.self) {
      Prop("url") { (view: ReactNativeVideoCallView, url: URL) in
        if view.webView.url != url {
          view.webView.load(URLRequest(url: url))
        }
      }

      Events("onLoad")
    }
  }

  private func startCallObservation() {
    // Create delegate with callbacks that send events
    let delegate = PhoneCallDelegate(
      onCallStarted: { [weak self] callId in
        self?.sendEvent("onPhoneCallStarted", [
          "type": "cellular",
          "callId": callId
        ])
      },
      onCallEnded: { [weak self] callId in
        guard let self = self else { return }
        if !self.isInterruptionActive {
          self.sendEvent("onPhoneCallEnded", [
            "type": "cellular",
            "callId": callId
          ])
        }
      }
    )

    // Set up CXCallObserver
    let observer = CXCallObserver()
    observer.setDelegate(delegate, queue: nil)

    // Snapshot already-active calls (e.g. WebRTC's CallKit call)
    // so we don't falsely detect them as NEW phone calls
    delegate.snapshotExistingCalls(observer)

    self.callObserver = observer
    self.callDelegate = delegate

    // Listen for AVAudioSession interruptions (alarms, Siri, etc.)
    self.interruptionObserver = NotificationCenter.default.addObserver(
      forName: AVAudioSession.interruptionNotification,
      object: nil,
      queue: nil
    ) { [weak self] notification in
      self?.handleAudioInterruption(notification)
    }

    isInterruptionActive = false
  }

  private func stopCallObservation() {
    if let observer = callObserver {
      observer.setDelegate(nil, queue: nil)
      callObserver = nil
    }

    callDelegate = nil

    if let observer = interruptionObserver {
      NotificationCenter.default.removeObserver(observer)
      interruptionObserver = nil
    }

    isInterruptionActive = false
  }

  private func handleAudioInterruption(_ notification: Notification) {
    guard let userInfo = notification.userInfo,
          let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
          let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
      return
    }

    switch type {
    case .began:
      // Only send if no CXCallObserver call is already tracked
      if callDelegate == nil && !isInterruptionActive {
        isInterruptionActive = true
        sendEvent("onPhoneCallStarted", [
          "type": "audio-interruption"
        ])
      }

    case .ended:
      if isInterruptionActive {
        isInterruptionActive = false
        sendEvent("onPhoneCallEnded", [
          "type": "audio-interruption"
        ])
      }

    @unknown default:
      break
    }
  }
}
