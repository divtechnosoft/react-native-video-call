// Reexport the native module. On web, it will be resolved to ReactNativeVideoCallModule.web.ts
// and on native platforms to ReactNativeVideoCallModule.ts
export { default } from './ReactNativeVideoCallModule';
export { default as ReactNativeVideoCallView } from './ReactNativeVideoCallView';
export * from  './ReactNativeVideoCall.types';
