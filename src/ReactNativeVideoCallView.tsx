import { requireNativeView } from 'expo';
import * as React from 'react';

import { ReactNativeVideoCallViewProps } from './ReactNativeVideoCall.types';

const NativeView: React.ComponentType<ReactNativeVideoCallViewProps> =
  requireNativeView('ReactNativeVideoCall');

export default function ReactNativeVideoCallView(props: ReactNativeVideoCallViewProps) {
  return <NativeView {...props} />;
}
