# react-native-video-call

A plug-and-play WebRTC video and voice calling library for React Native with native audio routing, phone call detection, and pause/resume support.

<p align="center">
  <strong>1-to-1 Video Calls</strong> &bull;
  <strong>Voice Calls</strong> &bull;
  <strong>Native Audio Routing</strong> &bull;
  <strong>Phone Call Detection</strong>
</p>

## Features

| Feature | Android | iOS |
|---|:---:|:---:|
| 1-to-1 video calls | ✓ | Coming Soon |
| Voice-only calls | ✓ | Coming Soon |
| Speaker / earpiece switching | ✓ | Coming Soon |
| Mute / unmute microphone | ✓ | Coming Soon |
| Camera on / off toggle | ✓ | Coming Soon |
| Auto-pause on phone call | ✓ | Coming Soon |
| Manual pause / resume | ✓ | Coming Soon |
| Connection state recovery | ✓ | Coming Soon |
| Camera / mute status sync | ✓ | Coming Soon |
| ICE server configuration | ✓ | Coming Soon |
| Custom signaling server | ✓ | Coming Soon |

### Highlights

- **One component to render** - Drop in `<VideoCall>` and you have a working call
- **Native audio management** - Forces loudspeaker on Android via `setCommunicationDevice()` (Android 12+) with proper audio focus handling
- **Phone call aware** - Automatically pauses the video call when a cellular call comes in, with a resume overlay when it ends
- **Connection resilient** - Detects disconnections, shows reconnecting state, and recovers automatically
- **Expo module** - Works with Expo dev clients (not Expo Go)
- **Built on WebRTC M124** - Uses `react-native-webrtc` under the hood

## Requirements

| Requirement | Version |
|---|---|
| React Native | >= 0.76 |
| Expo SDK | >= 54 |
| Android minSdk | 24 |
| Node.js | >= 18 |
| Expo dev client | Required (not Expo Go) |

## Installation

```bash
npm install react-native-video-call
```

### Android Setup

The following permissions are automatically added by the library. Verify they appear in your `AndroidManifest.xml` after `prebuild`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
```

If using a bare React Native project, ensure [expo modules are configured](https://docs.expo.dev/bare/installing-expo-modules/).

### iOS Setup

Coming Soon

### Expo Setup

This library requires a [development build](https://docs.expo.dev/develop/development-builds/introduction/) — it will not work in Expo Go because it uses custom native code.

```bash
npx expo install react-native-video-call
npx expo prebuild --clean
npx expo run:android
```

## Signaling Server

This library uses a Socket.io-based signaling server for WebRTC session negotiation. You need a signaling server running before you can make calls.

**Set up the official signaling server:** [divtechnosoft/webrtc-signaling-server](https://github.com/divtechnosoft/webrtc-signaling-server)

Follow the setup instructions in that repository to get your server running. Then come back here and point your `signalingUrl` to it.

If you prefer to build your own, the protocol is documented below.

### Protocol

The signaling server must implement the following Socket.io events:

#### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join` | `{ roomId, userId }` | Join a room |
| `leave` | `{ roomId, userId }` | Leave a room |
| `offer` | `{ targetUserId, fromUserId, sdp }` | Send SDP offer |
| `answer` | `{ targetUserId, fromUserId, sdp }` | Send SDP answer |
| `ice-candidate` | `{ targetUserId, fromUserId, candidate }` | Send ICE candidate |
| `pause` | `{ targetUserId, fromUserId }` | Notify remote user of pause |
| `resume` | `{ targetUserId, fromUserId }` | Notify remote user of resume |
| `camera-off` | `{ targetUserId, fromUserId }` | Notify camera turned off |
| `camera-on` | `{ targetUserId, fromUserId }` | Notify camera turned on |
| `muted` | `{ targetUserId, fromUserId }` | Notify mic muted |
| `unmuted` | `{ targetUserId, fromUserId }` | Notify mic unmuted |

#### Server → Client

| Event | Payload | Description |
|---|---|---|
| `room-users` | `{ users: string[] }` | List of user IDs already in the room |
| `user-joined` | `{ userId }` | A new user joined the room |
| `user-left` | `{ userId }` | A user left the room |
| `offer` | `{ fromUserId, sdp }` | SDP offer from a remote user |
| `answer` | `{ fromUserId, sdp }` | SDP answer from a remote user |
| `ice-candidate` | `{ fromUserId, candidate }` | ICE candidate from a remote user |
| `user-paused` | `{ userId }` | Remote user paused their call |
| `user-resumed` | `{ userId }` | Remote user resumed their call |
| `user-camera-off` | `{ userId }` | Remote user turned camera off |
| `user-camera-on` | `{ userId }` | Remote user turned camera on |
| `user-muted` | `{ userId }` | Remote user muted their mic |
| `user-unmuted` | `{ userId }` | Remote user unmuted their mic |
| `error` | `{ message }` | Server error |

### Minimal Server Example

```js
const { Server } = require("socket.io");

const io = new Server(8080, { cors: { origin: "*" } });
const rooms = new Map(); // roomId → Set of socket ids

io.on("connection", (socket) => {
  socket.on("join", ({ roomId, userId }) => {
    socket.join(roomId);
    socket.data = { roomId, userId };

    const users = [];
    for (const s of io.sockets.adapter.rooms.get(roomId) || []) {
      const u = io.sockets.sockets.get(s)?.data;
      if (u && u.userId !== userId) users.push(u.userId);
    }
    socket.emit("room-users", { users });
    socket.to(roomId).emit("user-joined", { userId });
  });

  socket.on("leave", ({ roomId, userId }) => {
    socket.leave(roomId);
    socket.to(roomId).emit("user-left", { userId });
  });

  ["offer", "answer", "ice-candidate"].forEach((event) => {
    socket.on(event, (data) => {
      socket.to(data.targetUserId).emit(event, {
        fromUserId: data.fromUserId,
        ...(["sdp", "candidate"].includes(event === "ice-candidate" ? "candidate" : "sdp")
          ? { sdp: data.sdp, candidate: data.candidate }
          : {}),
        ...(data.sdp ? { sdp: data.sdp } : {}),
        ...(data.candidate ? { candidate: data.candidate } : {}),
      });
    });
  });

  ["pause", "resume", "camera-off", "camera-on", "muted", "unmuted"].forEach(
    (event) => {
      socket.on(event, ({ targetUserId, fromUserId }) => {
        socket.to(targetUserId).emit(event, { userId: fromUserId });
      });
    }
  );

  socket.on("disconnect", () => {
    if (socket.data) {
      socket.to(socket.data.roomId).emit("user-left", { userId: socket.data.userId });
    }
  });
});
```

> **Note:** The above is a minimal example for development. For production, add authentication, rate limiting, TURN server credentials, and proper error handling.

## Quick Start

```tsx
import { VideoCall } from 'react-native-video-call';

function CallScreen({ route }) {
  const { roomId, userId } = route.params;

  return (
    <VideoCall
      roomId={roomId}
      userId={userId}
      signalingUrl="https://your-signaling-server.com"
      onCallStateChange={(state) => console.log('Call state:', state)}
      onError={(error) => console.error('Call error:', error)}
    />
  );
}
```

That's it. The `VideoCall` component handles:

- Peer connection setup and WebRTC negotiation
- Local camera/mic access and stream management
- Speaker routing (loudspeaker for video calls)
- In-call controls (mute, camera, speaker, end call)
- Pause/resume when a phone call interrupts
- Graceful cleanup when the call ends

### With ICE Servers

For production calls across different networks, add TURN servers:

```tsx
import { VideoCall } from 'react-native-video-call';

<VideoCall
  roomId={roomId}
  userId={userId}
  signalingUrl="https://your-signaling-server.com"
  iceServers={[
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'username',
      credential: 'password',
    },
  ]}
/>
```

### Voice-Only Calls

```tsx
<VideoCall
  roomId={roomId}
  userId={userId}
  signalingUrl={signalingUrl}
  enableVideo={false}
/>
```

## API Reference

### `<VideoCall>`

The main component. Handles the entire video call lifecycle.

| Prop | Type | Default | Description |
|---|---|---|---|
| `roomId` | `string` | **Required** | Room identifier for the call |
| `userId` | `string` | **Required** | Current user's identifier |
| `signalingUrl` | `string` | `'http://localhost:8080'` | Socket.io signaling server URL |
| `iceServers` | `ICEServer[]` | Google STUN servers | ICE servers for NAT traversal |
| `enableAudio` | `boolean` | `true` | Enable audio track |
| `enableVideo` | `boolean` | `true` | Enable video track |
| `onCallStateChange` | `(state: CallState) => void` | - | Called when call state changes |
| `onUserJoined` | `(user: CallUser) => void` | - | Called when a remote user joins |
| `onUserLeft` | `(userId: string) => void` | - | Called when a remote user leaves |
| `onError` | `(error: Error) => void` | - | Called on errors |
| `style` | `object` | - | Custom style for the container |

### Call States

```typescript
type CallState =
  | 'idle'                    // Initial state
  | 'requesting-permissions'  // Asking for camera/mic access
  | 'connecting'             // WebRTC negotiation in progress
  | 'connected'              // Call is active
  | 'reconnecting'           // Connection lost, attempting recovery
  | 'paused'                 // Call paused (phone call or manual)
  | 'resuming'               // Resuming from pause
  | 'failed'                 // Connection failed
  | 'ended'                  // Call ended by this user
  | 'remote-ended';          // Call ended by remote user
```

### Hooks

#### `usePermissions`

Handle camera and microphone permissions.

```tsx
import { usePermissions } from 'react-native-video-call';

function CallScreen() {
  const { hasCamera, hasMicrophone, requestPermissions } = usePermissions();

  if (!hasCamera || !hasMicrophone) {
    return <Button onPress={requestPermissions} title="Grant Permissions" />;
  }

  return <VideoCall ... />;
}
```

| Return | Type | Description |
|---|---|---|
| `hasCamera` | `boolean` | Camera permission granted |
| `hasMicrophone` | `boolean` | Microphone permission granted |
| `isRequesting` | `boolean` | Permission request in progress |
| `error` | `string \| null` | Last permission error |
| `requestPermissions` | `() => Promise<boolean>` | Request both permissions |
| `checkPermissions` | `() => Promise<PermissionState>` | Check current permission state |

#### `usePhoneCallDetection`

Detect incoming cellular calls and audio interruptions.

```tsx
import { usePhoneCallDetection } from 'react-native-video-call';

function CallScreen() {
  const { isPhoneCallActive } = usePhoneCallDetection({
    enabled: true,
    onPhoneCallStarted: () => console.log('Phone call started'),
    onPhoneCallEnded: () => console.log('Phone call ended'),
  });
}
```

| Option | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | `false` | Enable detection |
| `onPhoneCallStarted` | `(event: PhoneCallEvent) => void` | - | Cellular call or audio interruption started |
| `onPhoneCallEnded` | `(event: PhoneCallEvent) => void` | - | Interruption ended |

| Return | Type | Description |
|---|---|---|
| `isPhoneCallActive` | `boolean` | A phone call is currently active |
| `phoneCallType` | `'cellular' \| 'audio-interruption' \| null` | Type of interruption |
| `hasPermission` | `boolean` | Has `READ_PHONE_STATE` permission |
| `requestPermission` | `() => Promise<boolean>` | Request phone state permission |

#### `useSignaling`

React hook for managing a Socket.io signaling connection.

```tsx
import { useSignaling } from 'react-native-video-call';

function CallScreen() {
  const { isConnected, joinRoom, sendOffer } = useSignaling({
    url: 'https://your-server.com',
    roomId: 'room-123',
    userId: 'user-1',
    onMessage: (msg) => console.log('Message:', msg),
  });
}
```

| Option | Type | Description |
|---|---|---|
| `url` | `string` | Signaling server URL |
| `roomId` | `string` | Room to join |
| `userId` | `string` | Current user ID |
| `onMessage` | `(msg: SignalingMessage) => void` | Incoming message handler |

#### `useWebRTC`

Complete WebRTC connection management hook.

```tsx
import { useWebRTC } from 'react-native-video-call';

function CustomCallScreen() {
  const {
    localStream,
    remoteStream,
    callState,
    startLocalMedia,
    endCall,
  } = useWebRTC({
    roomId: 'room-123',
    userId: 'user-1',
    onCallStateChange: (state) => console.log(state),
  });
}
```

### Services

#### `AudioManager`

Direct control over audio routing. The `VideoCall` component uses this internally, but you can use it directly for custom implementations.

```tsx
import { AudioManager } from 'react-native-video-call';

// Initialize after getUserMedia (video call = loudspeaker)
await AudioManager.initialize('video-call');

// Toggle speaker ↔ earpiece
const isSpeakerOn = await AudioManager.toggleSpeaker();

// Re-apply current route (call when remote track arrives)
await AudioManager.reapplyRoute();

// Reset on call end
await AudioManager.cleanup();
```

| Method | Description |
|---|---|
| `initialize(mode)` | Set up audio routing. `'video-call'` = loudspeaker, `'voice-call'` = earpiece. Call **after** `getUserMedia`. |
| `toggleSpeaker()` | Toggle between loudspeaker and earpiece. Returns new state. |
| `reapplyRoute()` | Re-apply current speaker/earpiece routing. Call when remote stream arrives. |
| `cleanup()` | Reset audio to normal mode. Call when call ends. |
| `getIsSpeakerOn()` | Returns current speaker state. |

> **Android note:** The native module requests audio focus and uses `setCommunicationDevice()` on Android 12+ for reliable speaker routing. WebRTC's internal audio manager may override routing — `reapplyRoute()` fixes this.

#### `SignalingClient`

Socket.io signaling client. Use directly if you need more control than the `useSignaling` hook.

```tsx
import { SignalingClient } from 'react-native-video-call';

const client = new SignalingClient('https://your-server.com');
client.onMessage((msg) => { /* handle */ });
await client.connect();
client.joinRoom('room-123', 'user-1');
client.sendOffer('user-2', sdp);
client.disconnect();
```

| Method | Description |
|---|---|
| `connect()` | Connect to signaling server. Returns Promise. |
| `disconnect()` | Disconnect from server. |
| `isConnected()` | Check connection status. |
| `onMessage(handler)` | Register message handler. |
| `onConnectionChange(handler)` | Register connection state handler. |
| `joinRoom(roomId, userId)` | Join a room. |
| `leaveRoom(roomId, userId)` | Leave a room. |
| `sendOffer(targetUserId, sdp)` | Send SDP offer. |
| `sendAnswer(targetUserId, sdp)` | Send SDP answer. |
| `sendIceCandidate(targetUserId, candidate)` | Send ICE candidate. |
| `sendPause(targetUserId, fromUserId)` | Notify pause. |
| `sendResume(targetUserId, fromUserId)` | Notify resume. |
| `sendCameraOff(targetUserId, fromUserId)` | Notify camera off. |
| `sendCameraOn(targetUserId, fromUserId)` | Notify camera on. |
| `sendMuted(targetUserId, fromUserId)` | Notify mic muted. |
| `sendUnmuted(targetUserId, fromUserId)` | Notify mic unmuted. |

#### `PeerConnection`

WebRTC peer connection wrapper. Use for custom call implementations.

```tsx
import { PeerConnection } from 'react-native-video-call';

const pc = new PeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  enableAudio: true,
  enableVideo: true,
});

const stream = await pc.getLocalStream();
pc.addLocalStream(stream);
const offer = await pc.createOffer();
await pc.setRemoteDescription(remoteSdp);
const answer = await pc.createAnswer();
pc.close();
```

### Utilities

#### `DEFAULT_ICE_SERVERS`

Pre-configured Google STUN servers for basic NAT traversal.

```tsx
import { DEFAULT_ICE_SERVERS } from 'react-native-video-call';
// [{ urls: 'stun:stun.l.google.com:19302' }, ...]
```

#### `getIceServers(turnCredentials?)`

Get ICE servers with optional TURN credentials.

```tsx
import { getIceServers } from 'react-native-video-call';

const servers = getIceServers({
  urls: 'turn:your-turn-server.com:3478',
  username: 'user',
  credential: 'pass',
});
```

## Running the Example App

The example app is a complete 1-to-1 video call demo. You need **two devices** (or a device + emulator) to test a call.

### 1. Start the Signaling Server

```bash
# Install socket.io
npm install socket.io

# Save the minimal server from the "Signaling Server" section as server.js
node server.js
```

The server runs on port `8080` by default.

### 2. Build and Run the Example

```bash
cd react-native-video-call/example

# Install dependencies
npm install

# Build native code
npx expo prebuild --clean

# Run on Android
npx expo run:android

# Or run on iOS (Coming Soon)
# npx expo run:ios
```

### 3. Test a Call

1. Launch the app on **Device A** — enter a room ID (e.g., `room_123`) and your name
2. Launch the app on **Device B** — enter the **same room ID** and a different name
3. Both users tap **Join Call**
4. The call connects automatically — you should see and hear each other

### Android Emulator Networking

If the signaling server runs on your development machine and you're using an Android emulator, the app automatically uses `10.0.2.2` instead of `localhost` to reach the host machine. This is configured in the example app's `src/config/index.ts`.

For physical Android devices, make sure both the device and the server are on the same network, and use your machine's local IP address (e.g., `http://192.168.1.100:8080`).

### Configuring the Server URL

In the example app, tap the **settings icon** (gear) on the join screen to change the signaling server URL. The setting persists across app restarts.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   VideoCall                      │
│  (orchestrates everything below)                │
├─────────┬──────────┬──────────┬─────────────────┤
│Signaling│   Peer   │  Audio   │  Phone Call     │
│ Client  │Connection│ Manager  │  Detection      │
│(Socket) │ (WebRTC) │ (Native) │  (Native)       │
└─────────┴──────────┴──────────┴─────────────────┘
```

- **SignalingClient** — Socket.io transport for SDP offer/answer exchange and ICE candidate relay
- **PeerConnection** — WebRTC peer connection with automatic ICE negotiation
- **AudioManager** — Native module that controls Android `AudioManager` with proper audio focus and `setCommunicationDevice()` API
- **Phone call detection** — Native module that monitors cellular call state via `TelephonyCallback` / `CXCallObserver`

## Troubleshooting

### Audio comes from earpiece instead of loudspeaker (Android)

This is the most common issue. It happens because WebRTC's internal audio manager overrides `setSpeakerphoneOn()`. The library handles this by:

1. Requesting audio focus before routing changes
2. Using `setCommunicationDevice(TYPE_BUILTIN_SPEAKER)` on Android 12+
3. Re-applying speaker routing when remote tracks arrive

If it still doesn't work:

- Verify `MODIFY_AUDIO_SETTINGS` permission is in your `AndroidManifest.xml`
- Ensure `AudioManager.initialize()` is called **after** `getUserMedia()`
- Check that `AudioManager.reapplyRoute()` fires when the remote stream arrives (check console logs for `[AudioManager] Re-applying route`)
- Try a clean build: `cd android && ./gradlew clean && cd .. && npx expo run:android`

### `nativeModule.setSpeakerOn is not a function`

The native module is not compiled into your build. This happens when:

- You're using **Expo Go** instead of a development build — switch to `expo-dev-client`
- The library is not autolinked — run `npx expo prebuild --clean` and rebuild
- The native build is stale — clean and rebuild

### Black screen on remote video

- Check that both users have granted camera and microphone permissions
- Verify the signaling server is relaying offer/answer/ICE messages correctly
- Check that ICE servers are reachable (STUN servers may be blocked on corporate networks)
- Try adding TURN servers for restricted networks

### `setSpeakerOn not available on native module`

The native module loaded but doesn't have the `setSpeakerOn` method. Run:

```bash
npx expo prebuild --clean
npx expo run:android
```

### App crashes on iOS Simulator

The iOS Simulator does not fully support WebRTC audio. Test on a physical device.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
