/**
 * ICE Servers Configuration
 * Default STUN/TURN servers for WebRTC NAT traversal
 */

import { ICEServer } from '../types';

// Default STUN servers (free, no authentication needed)
export const DEFAULT_ICE_SERVERS: ICEServer[] = [
  {
    urls: 'stun:stun.l.google.com:19302',
  },
  {
    urls: 'stun:stun1.l.google.com:19302',
  },
  {
    urls: 'stun:stun2.l.google.com:19302',
  },
];

// Get ICE servers with optional TURN credentials
export function getIceServers(turnCredentials?: {
  urls: string | string[];
  username: string;
  credential: string;
}): ICEServer[] {
  const servers = [...DEFAULT_ICE_SERVERS];

  if (turnCredentials) {
    servers.push({
      urls: turnCredentials.urls,
      username: turnCredentials.username,
      credential: turnCredentials.credential,
    });
  }

  return servers;
}
