export const ROOM_COUNT = 4;

export function cycleRoomIndex(current: number, direction: number, count = ROOM_COUNT): number {
  if (count < 1) return 0;
  return (current + direction + count) % count;
}

export function selectRoomIndex(index: number, count = ROOM_COUNT): number {
  if (count < 1) return 0;
  return Math.min(Math.max(index, 0), count - 1);
}

export function swipeDirection(startX: number, endX: number, threshold = 42): number {
  const distance = endX - startX;
  if (Math.abs(distance) <= threshold) return 0;
  return distance < 0 ? 1 : -1;
}
