import * as React from 'react';

import { ReactNativeVideoCallViewProps } from './ReactNativeVideoCall.types';

export default function ReactNativeVideoCallView(props: ReactNativeVideoCallViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
