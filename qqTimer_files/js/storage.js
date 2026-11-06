/**
 * QQTimer - Storage Module
 * Manages localStorage persistence with 100% backward compatibility
 * to qqTimer classic session format: "session{id}" -> "time|comment+,time- >"
 */

(function (window) {
  'use strict';

  window.QQTimer = window.QQTimer || {};

  const Storage = {
    /**
     * Serializes and saves solves array into localStorage
     * @param {number} sessionID 0-indexed session number (0..24)
     * @param {Array} solves Array of solve objects
     */
    saveSession: function (sessionID, solves) {
      try {
        const key = 'session' + sessionID;
        if (!solves || solves.length === 0) {
          localStorage.removeItem(key);
          return;
        }

        // Format: time|comment+,time- >
        let s = '';
        for (let i = 0; i < solves.length; i++) {
          const item = solves[i];
          s += Math.round(item.time);
          if (item.comment) s += '|' + item.comment;
          if (item.penalty === 1) s += '-';
          if (item.penalty === 2) s += '+';
          if (i < solves.length - 1) s += ',';
        }
        s += '>';
        localStorage.setItem(key, s);
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
    },

    /**
     * Loads and deserializes solves array from localStorage
     * @param {number} sessionID 0-indexed session number (0..24)
     * @returns {Array} Array of parsed solve objects
     */
    loadSession: function (sessionID) {
      const solves = [];
      try {
        const key = 'session' + sessionID;
        const s = localStorage.getItem(key);
        if (!s || s.length === 0) {
          return solves;
        }

        const rawSolves = s.split(',');
        for (let j = 0; j < rawSolves.length; j++) {
          let entry = rawSolves[j].trim();
          if (entry.endsWith('>')) entry = entry.slice(0, -1);
          if (!entry) continue;

          let penalty = 0; // 0: None, 1: DNF, 2: +2
          if (entry.endsWith('-')) {
            penalty = 1;
            entry = entry.slice(0, -1);
          } else if (entry.endsWith('+')) {
            penalty = 2;
            entry = entry.slice(0, -1);
          }

          const parts = entry.split('|');
          const time = parseInt(parts[0], 10);
          const comment = parts[1] || '';

          if (!isNaN(time) && time > 0) {
            solves.push({
              time: time,
              penalty: penalty,
              comment: comment,
              scramble: '',
              date: Date.now()
            });
          }
        }
      } catch (e) {
        console.error('LocalStorage load error:', e);
      }
      return solves;
    },

    /**
     * Clears a specific session
     * @param {number} sessionID
     */
    clearSession: function (sessionID) {
      try {
        localStorage.removeItem('session' + sessionID);
      } catch (e) {
        console.warn('LocalStorage clear error:', e);
      }
    }
  };

  window.QQTimer.Storage = Storage;
})(window);
