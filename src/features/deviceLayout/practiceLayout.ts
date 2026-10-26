import type { DeviceReservedRegions, ReservedRegionFrame } from '../../../modules/splitbeat-device-layout/src';

export type PracticeSplitAxis = 'horizontal' | 'vertical';

export interface PracticePaneFrame {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface PracticeLayout {
  axis: PracticeSplitAxis;
  division: PracticePaneFrame | null;
  safeTopInset: number;
  leftHand: PracticePaneFrame;
  rightHand: PracticePaneFrame;
  preview: PracticePaneFrame;
}

function clampFrame(frame: ReservedRegionFrame, width: number, height: number, scaleX: number, scaleY: number): PracticePaneFrame {
  const left = Math.max(0, Math.min(width, frame.x * scaleX));
  const top = Math.max(0, Math.min(height, frame.y * scaleY));
  const right = Math.max(left, Math.min(width, (frame.x + frame.width) * scaleX));
  const bottom = Math.max(top, Math.min(height, (frame.y + frame.height) * scaleY));
  return { left, top, width: right - left, height: bottom - top };
}

function fullScreenFrame(width: number, height: number): PracticePaneFrame {
  return { left: 0, top: 0, width, height };
}

function splitHorizontally(width: number, height: number, division: PracticePaneFrame | null, safeTopInset: number): PracticeLayout {
  const leftEnd = division ? division.left : width / 2;
  const rightStart = division ? division.left + division.width : width / 2;
  const leftHand = { left: 0, top: 0, width: leftEnd, height };
  const rightHand = { left: rightStart, top: 0, width: width - rightStart, height };
  return { axis: 'horizontal', division, safeTopInset, leftHand, rightHand, preview: division ? leftHand : fullScreenFrame(width, height) };
}

function splitVertically(width: number, height: number, division: PracticePaneFrame | null, safeTopInset: number): PracticeLayout {
  const topEnd = division ? division.top : height / 2;
  const bottomStart = division ? division.top + division.height : height / 2;
  const leftHand = { left: 0, top: 0, width, height: topEnd };
  const rightHand = { left: 0, top: bottomStart, width, height: height - bottomStart };
  return { axis: 'vertical', division, safeTopInset, leftHand, rightHand, preview: division ? leftHand : fullScreenFrame(width, height) };
}

export function practiceLayoutForScreen(
  width: number,
  height: number,
  regions: DeviceReservedRegions,
): PracticeLayout {
  const screenWidth = Math.max(0, width);
  const screenHeight = Math.max(0, height);
  const nativeWidth = regions.width > 0 ? regions.width : screenWidth;
  const nativeHeight = regions.height > 0 ? regions.height : screenHeight;
  const scaleX = nativeWidth > 0 ? screenWidth / nativeWidth : 1;
  const scaleY = nativeHeight > 0 ? screenHeight / nativeHeight : 1;
  const activeDivision = regions.division.find((frame) => frame.width > 0 && frame.height > 0);
  const division = activeDivision
    ? clampFrame(activeDivision, screenWidth, screenHeight, scaleX, scaleY)
    : null;
  const safeTopInset = regions.occlusion
    .map((frame) => clampFrame(frame, screenWidth, screenHeight, scaleX, scaleY))
    .filter((frame) => frame.top <= 1 && frame.height > 0)
    .reduce((inset, frame) => Math.max(inset, frame.top + frame.height), 0);
  const axis: PracticeSplitAxis = division
    ? division.width < division.height ? 'horizontal' : 'vertical'
    : screenWidth >= screenHeight ? 'horizontal' : 'vertical';

  return axis === 'horizontal'
    ? splitHorizontally(screenWidth, screenHeight, division, safeTopInset)
    : splitVertically(screenWidth, screenHeight, division, safeTopInset);
}
