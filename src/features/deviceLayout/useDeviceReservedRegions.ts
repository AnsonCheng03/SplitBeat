import { useEffect, useState } from 'react';
import {
  getDeviceReservedRegions,
  subscribeToDeviceReservedRegions,
  type DeviceReservedRegions,
} from '../../../modules/splitbeat-device-layout/src';

const EMPTY_REGIONS: DeviceReservedRegions = {
  division: [],
  occlusion: [],
  width: 0,
  height: 0,
};

export function useDeviceReservedRegions(width: number, height: number): DeviceReservedRegions {
  const [regions, setRegions] = useState(EMPTY_REGIONS);

  useEffect(() => {
    let active = true;
    const updateRegions = (next: DeviceReservedRegions) => {
      if (active) setRegions(next);
    };
    const subscription = subscribeToDeviceReservedRegions(updateRegions);
    void Promise.resolve(getDeviceReservedRegions()).then(updateRegions).catch(() => {});

    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve(getDeviceReservedRegions())
      .then((next) => {
        if (active) setRegions(next);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [height, width]);

  return regions;
}
