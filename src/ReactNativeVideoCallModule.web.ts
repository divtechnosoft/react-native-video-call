import { registerWebModule, NativeModule } from 'expo';

import { ReactNativeVideoCallModuleEvents } from './ReactNativeVideoCall.types';

class ReactNativeVideoCallModule extends NativeModule<ReactNativeVideoCallModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(ReactNativeVideoCallModule, 'ReactNativeVideoCallModule');
