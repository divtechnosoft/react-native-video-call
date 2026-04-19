import ExpoModulesCore
import CallKit
import AVFoundation

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
        if wasEmpty { onCallStarted(call.uuid.uuidString) }
      }
    }
    if call.hasEnded {
      activeCallUUIDs.remove(call.uuid)
      if activeCallUUIDs.isEmpty { onCallEnded(call.uuid.uuidString) }
    }
  }

  func snapshotExistingCalls(_ observer: CXCallObserver) {
    for call in observer.calls {
      if call.hasConnected && !call.hasEnded { activeCallUUIDs.insert(call.uuid) }
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

    // Phone Call Detection
    AsyncFunction("startObservingPhoneCalls") { startCallObservation() }
    AsyncFunction("stopObservingPhoneCalls") { stopCallObservation() }
    Function("isCallDetectionAvailable") { return true }

    // Audio Routing
    AsyncFunction("setCommunicationMode") {
      let session = AVAudioSession.sharedInstance()
      try session.setCategory(.playAndRecord, mode: .videoChat, options: [.defaultToSpeaker, .allowBluetooth])
      try session.setActive(true)
    }

    AsyncFunction("setSpeakerOn") { on: Bool in
      let session = AVAudioSession.sharedInstance()
      if on {
        try session.setCategory(.playAndRecord, mode: .videoChat, options: [.defaultToSpeaker, .allowBluetooth])
        try session.setActive(true)
        try session.overrideOutputAudioPort(.speaker)
      } else {
        try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetooth])
        try session.setActive(true)
        try session.overrideOutputAudioPort(.none)
      }
    }

    AsyncFunction("resetAudio") {
      let session = AVAudioSession.sharedInstance()
      try session.setCategory(.soloAmbient, mode: .default, options: [])
      try session.setActive(false)
    }

    Function("getAudioState") {
      let session = AVAudioSession.sharedInstance()
      let route = session.currentRoute
      var outputPort = "unknown"
      if let output = route.outputs.first { outputPort = output.portType.rawValue }
      return [
        "category": session.category.rawValue,
        "mode": session.mode.rawValue,
        "outputPort": outputPort
      ]
    }

    View(ReactNativeVideoCallView.self) {
      Prop("url") { (view: ReactNativeVideoCallView, url: URL) in
        if view.webView.url != url { view.webView.load(URLRequest(url: url)) }
      }
      Events("onLoad")
    }
  }

  private func startCallObservation() {
    let delegate = PhoneCallDelegate(
      onCallStarted: { [weak self] callId in
        self?.sendEvent("onPhoneCallStarted", ["type": "cellular", "callId": callId])
      },
      onCallEnded: { [weak self] callId in
        guard let self = self else { return }
        if !self.isInterruptionActive {
          self.sendEvent("onPhoneCallEnded", ["type": "cellular", "callId": callId])
        }
      }
    )
    let observer = CXCallObserver()
    observer.setDelegate(delegate, queue: nil)
    delegate.snapshotExistingCalls(observer)
    self.callObserver = observer
    self.callDelegate = delegate

    self.interruptionObserver = NotificationCenter.default.addObserver(
      forName: AVAudioSession.interruptionNotification, object: nil, queue: nil
    ) { [weak self] notification in self?.handleAudioInterruption(notification) }
    isInterruptionActive = false
  }

  private func stopCallObservation() {
    if let observer = callObserver { observer.setDelegate(nil, queue: nil); callObserver = nil }
    callDelegate = nil
    if let observer = interruptionObserver { NotificationCenter.default.removeObserver(observer); interruptionObserver = nil }
    isInterruptionActive = false
  }

  private func handleAudioInterruption(_ notification: Notification) {
    guard let userInfo = notification.userInfo,
          let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
          let type = AVAudioSession.InterruptionType(rawValue: typeValue) else { return }
    switch type {
    case .began:
      if callDelegate == nil && !isInterruptionActive {
        isInterruptionActive = true
        sendEvent("onPhoneCallStarted", ["type": "audio-interruption"])
      }
    case .ended:
      if isInterruptionActive {
        isInterruptionActive = false
        sendEvent("onPhoneCallEnded", ["type": "audio-interruption"])
      }
    @unknown default: break
    }
  }
}
