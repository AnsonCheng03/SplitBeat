import { requireOptionalNativeModule } from 'expo';

export interface ReservedRegionFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DeviceReservedRegions {
  division: ReservedRegionFrame[];
  occlusion: ReservedRegionFrame[];
  width: number;
  height: number;
}

interface DeviceLayoutNativeModule {
  getReservedRegions: () => DeviceReservedRegions;
  addListener: (
    eventName: 'onReservedRegionsChanged',
    listener: (regions: DeviceReservedRegions) => void,
  ) => { remove: () => void };
}

const nativeModule = requireOptionalNativeModule<DeviceLayoutNativeModule>('SplitBeatDeviceLayout');

const emptyRegions: DeviceReservedRegions = {
  division: [],
  occlusion: [],
  width: 0,
  height: 0,
};

export function getDeviceReservedRegions(): DeviceReservedRegions | Promise<DeviceReservedRegions> {
  return nativeModule?.getReservedRegions() ?? emptyRegions;
}

export function subscribeToDeviceReservedRegions(
  listener: (regions: DeviceReservedRegions) => void,
): { remove: () => void } | null {
  return nativeModule?.addListener('onReservedRegionsChanged', listener) ?? null;
}
