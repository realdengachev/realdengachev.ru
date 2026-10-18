/** Чистая математика бесконечной ленты (без DOM). */

/** Положительный остаток: позиция внутри одного периода [0, period). */
export function wrap(pos: number, period: number): number {
  return ((pos % period) + period) % period;
}

/** Смещение трека относительно «нулевого» набора: набор №1 стоит у левого края при pos = 0. */
export function trackX(pos: number, period: number, origin: number): number {
  return origin - period - wrap(pos, period);
}

/** Эффект линзы: 0 в центре, плавно растёт к краям видимой области. */
export function lensZone(u: number, start = 0.5): number {
  const e = Math.min(Math.abs(u), 1);
  const t = Math.max(0, Math.min(1, (e - start) / (1 - start)));
  return t * t * (3 - 2 * t);
}
