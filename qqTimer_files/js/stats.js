/**
 * QQTimer - Statistics Module
 * High-precision WCA trimmed average, mean, standard deviation,
 * and rolling statistic calculation engine.
 */

(function (window) {
  'use strict';

  window.QQTimer = window.QQTimer || {};

  const Stats = {
    /**
     * Formats milliseconds into human-readable cube time
     * @param {number|null} ms Milliseconds
     * @param {number} precision 2 for 1/100s, 3 for 1/1000s
     * @param {number} penalty 0: None, 1: DNF, 2: +2
     * @returns {string} e.g. "12.34", "1:05.21", "DNF", "14.50+"
     */
    formatTime: function (ms, precision = 2, penalty = 0) {
      if (penalty === 1) return 'DNF';
      if (ms == null || isNaN(ms) || ms < 0) return '--';

      const displayMs = ms + (penalty === 2 ? 2000 : 0);
      const totalSeconds = displayMs / 1000;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);

      let subSecStr = '';
      if (precision === 3) {
        const sub = Math.floor(displayMs % 1000);
        subSecStr = sub.toString().padStart(3, '0');
      } else {
        const sub = Math.floor((displayMs % 1000) / 10);
        subSecStr = sub.toString().padStart(2, '0');
      }

      let result = '';
      if (hours > 0) {
        result = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${subSecStr}`;
      } else if (minutes > 0) {
        result = `${minutes}:${seconds.toString().padStart(2, '0')}.${subSecStr}`;
      } else {
        result = `${seconds}.${subSecStr}`;
      }

      if (penalty === 2) result += '+';
      return result;
    },

    /**
     * WCA Trimmed Average calculation (e.g. Ao5, Ao12, Ao50, Ao100)
     * Trims ceil(n / 20) best and worst solves.
     * @param {Array} solveSubArray Sub-array of solves
     * @returns {Object} { avg, sd, trimmedIndices }
     */
    calculateTrimmedAvg: function (solveSubArray) {
      const n = solveSubArray.length;
      if (n < 3) return { avg: null, sd: null, trimmedIndices: [] };

      // Map time list with original indices
      const items = solveSubArray.map((s, idx) => {
        let t = s.time;
        if (s.penalty === 2) t += 2000;
        if (s.penalty === 1) t = Infinity; // DNF counts as infinity
        return { time: t, originalIdx: idx };
      });

      // Sort ascending
      items.sort((a, b) => a.time - b.time);

      // Number of trimmed elements per side: ceil(n / 20)
      const trim = Math.ceil(n / 20);
      const trimmedBest = items.slice(0, trim);
      const trimmedWorst = items.slice(n - trim);
      const trimmedIndices = new Set([...trimmedBest, ...trimmedWorst].map(x => x.originalIdx));

      const middle = items.slice(trim, n - trim);
      const dnfCount = middle.filter(x => x.time === Infinity).length;
      if (dnfCount > 0) {
        return { avg: -1, sd: null, trimmedIndices: Array.from(trimmedIndices) }; // DNF
      }

      const sum = middle.reduce((acc, cur) => acc + cur.time, 0);
      const avg = sum / middle.length;

      // Sample Standard deviation
      let variance = 0;
      if (middle.length > 1) {
        for (const m of middle) {
          variance += Math.pow((m.time - avg) / 1000, 2);
        }
        variance = Math.sqrt(variance / (middle.length - 1));
      }

      return { avg: avg, sd: variance, trimmedIndices: Array.from(trimmedIndices) };
    },

    /**
     * Simple Mean calculation without trimming (e.g. Mo3)
     * @param {Array} solveSubArray
     * @returns {Object} { avg, sd }
     */
    calculateMean: function (solveSubArray) {
      const n = solveSubArray.length;
      if (n === 0) return { avg: null, sd: null };

      let sum = 0;
      let hasDNF = false;
      for (const s of solveSubArray) {
        if (s.penalty === 1) {
          hasDNF = true;
          break;
        }
        sum += s.time + (s.penalty === 2 ? 2000 : 0);
      }

      if (hasDNF) return { avg: -1, sd: null };
      const mean = sum / n;

      let variance = 0;
      if (n > 1) {
        for (const s of solveSubArray) {
          const val = s.time + (s.penalty === 2 ? 2000 : 0);
          variance += Math.pow((val - mean) / 1000, 2);
        }
        variance = Math.sqrt(variance / (n - 1));
      }

      return { avg: mean, sd: variance };
    },

    /**
     * Evaluates current and best rolling average across solves
     * @param {Array} solves Full solves array
     * @param {number} size Window size (e.g. 5, 12, 3)
     * @param {boolean} isTrimmed Whether to use trimmed average or mean
     * @returns {Object} { current, best }
     */
    evaluateRolling: function (solves, size, isTrimmed) {
      if (solves.length < size) return { current: null, best: null };
      let bestRes = null;
      let lastRes = null;

      for (let i = 0; i <= solves.length - size; i++) {
        const sub = solves.slice(i, i + size);
        const res = isTrimmed ? Stats.calculateTrimmedAvg(sub) : Stats.calculateMean(sub);
        if (res.avg !== null && res.avg !== -1) {
          if (bestRes === null || res.avg < bestRes.avg) {
            bestRes = { ...res, startIndex: i, size: size };
          }
        }
        if (i === solves.length - size) {
          lastRes = { ...res, startIndex: i, size: size };
        }
      }
      return { current: lastRes, best: bestRes };
    },

    /**
     * Calculates complete statistics payload for the active session
     * @param {Array} solves
     * @returns {Object}
     */
    calculateAllStats: function (solves) {
      const result = {
        totalCount: solves.length,
        validCount: solves.filter(s => s.penalty !== 1).length,
        bestSingle: null,
        worstSingle: null,
        currentAo5: null,
        bestAo5: null,
        currentAo12: null,
        bestAo12: null,
        currentMo3: null,
        bestMo3: null,
        currentAo50: null,
        bestAo50: null,
        currentAo100: null,
        bestAo100: null,
        sessionAvg: null,
        sessionMean: null,
        sessionSD: null
      };

      if (solves.length === 0) return result;

      // Best & Worst single
      let best = null;
      let worst = null;
      solves.forEach((s, idx) => {
        if (s.penalty === 1) return;
        const t = s.time + (s.penalty === 2 ? 2000 : 0);
        if (best === null || t < best.time) best = { time: t, index: idx };
        if (worst === null || t > worst.time) worst = { time: t, index: idx };
      });
      result.bestSingle = best;
      result.worstSingle = worst;

      // Rolling averages
      const ao5 = Stats.evaluateRolling(solves, 5, true);
      result.currentAo5 = ao5.current;
      result.bestAo5 = ao5.best;

      const ao12 = Stats.evaluateRolling(solves, 12, true);
      result.currentAo12 = ao12.current;
      result.bestAo12 = ao12.best;

      const mo3 = Stats.evaluateRolling(solves, 3, false);
      result.currentMo3 = mo3.current;
      result.bestMo3 = mo3.best;

      const ao50 = Stats.evaluateRolling(solves, 50, true);
      result.currentAo50 = ao50.current;
      result.bestAo50 = ao50.best;

      const ao100 = Stats.evaluateRolling(solves, 100, true);
      result.currentAo100 = ao100.current;
      result.bestAo100 = ao100.best;

      // Session Averages
      const sessTrim = Stats.calculateTrimmedAvg(solves);
      result.sessionAvg = sessTrim.avg;
      result.sessionSD = sessTrim.sd;

      const sessMean = Stats.calculateMean(solves);
      result.sessionMean = sessMean.avg;

      return result;
    }
  };

  window.QQTimer.Stats = Stats;
})(window);
