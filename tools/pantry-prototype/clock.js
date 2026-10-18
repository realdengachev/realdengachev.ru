// ?record — виртуальные часы для покадровой записи скринкаста.
// Подменяет время (performance.now, rAF, setTimeout) и синхронизирует CSS/WAAPI-анимации,
// чтобы каждый кадр рендерился с точным шагом без пропусков.
(function () {
  if (!/[?&]record\b/.test(location.search)) return;

  let now = 0;
  let rafId = 0;
  let timerId = 0;
  const rafs = new Map();
  const timers = [];
  const starts = new WeakMap();

  performance.now = () => now;
  window.requestAnimationFrame = (cb) => { rafs.set(++rafId, cb); return rafId; };
  window.cancelAnimationFrame = (id) => { rafs.delete(id); };
  window.setTimeout = (cb, ms = 0, ...args) => {
    timers.push({ id: ++timerId, t: now + ms, cb: () => cb(...args) });
    return timerId;
  };
  window.clearTimeout = (id) => {
    const i = timers.findIndex((t) => t.id === id);
    if (i >= 0) timers.splice(i, 1);
  };

  function syncAnimations() {
    for (const a of document.getAnimations()) {
      if (!starts.has(a)) starts.set(a, now);
      const t = now - starts.get(a);
      const end = a.effect?.getComputedTiming().endTime ?? 0;
      if (t >= end && Number.isFinite(end)) {
        a.finish();
      } else {
        a.pause();
        a.currentTime = t;
      }
    }
  }

  window.__clock = {
    get now() { return now; },
    async step(ms) {
      now += ms;
      timers.sort((a, b) => a.t - b.t);
      while (timers.length && timers[0].t <= now) {
        timers.shift().cb();
        await Promise.resolve();
      }
      const cbs = [...rafs.values()];
      rafs.clear();
      for (const cb of cbs) cb(now);
      await Promise.resolve();
      syncAnimations();
    },
  };
})();
