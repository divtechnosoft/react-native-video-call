import { NativeModule, requireNativeModule } from 'expo';

import { ReactNativeVideoCallModuleEvents } from './ReactNativeVideoCall.types';

declare class ReactNativeVideoCallModule extends NativeModule<ReactNativeVideoCallModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ReactNativeVideoCallModule>('ReactNativeVideoCall');
