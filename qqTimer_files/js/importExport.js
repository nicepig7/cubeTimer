/**
 * QQTimer - Import / Export Module
 * Handles exporting solves to standard text format and importing external solves.
 */

(function (window) {
  'use strict';

  window.QQTimer = window.QQTimer || {};

  const ImportExport = {
    /**
     * Formats solves array into plain text for export
     * @param {Array} solves
     * @param {number} sessionID
     * @param {number} precision
     * @returns {string}
     */
    formatForExport: function (solves, sessionID, precision = 2) {
      const Stats = window.QQTimer.Stats;
      return solves.map((s, idx) => {
        const timeFormatted = Stats ? Stats.formatTime(s.time, precision, s.penalty) : (s.time / 1000).toFixed(precision);
        const commentPart = s.comment ? ` [${s.comment}]` : '';
        const scramblePart = s.scramble ? ` ${s.scramble}` : '';
        return `${idx + 1}. ${timeFormatted}${commentPart}${scramblePart}`.trim();
      }).join('\n');
    },

    /**
     * Parses multiline text into array of solve objects
     * Accepts formats like: "1. 14.52 [note] R U R'", "(12.34)", "DNF(15.22)", "13.20+"
     * @param {string} text
     * @returns {Array} Array of valid solve objects
     */
    parseSolves: function (text) {
      if (!text || typeof text !== 'string') return [];
      const lines = text.trim().split('\n');
      const parsed = [];

      for (const line of lines) {
        let tStr = line.trim();
        if (!tStr) continue;

        let penalty = 0;
        let comment = '';

        // Extract bracketed comment [comment]
        if (tStr.includes('[') && tStr.includes(']')) {
          const match = tStr.match(/\[(.*?)\]/);
          if (match) comment = match[1];
          tStr = tStr.replace(/\[(.*?)\]/, '');
        }

        const tokens = tStr.split(/\s+/);
        let timeToken = tokens[0];
        if (timeToken.endsWith('.') && tokens.length > 1) {
          timeToken = tokens[1];
        }

        // Strip parentheses: (12.34)
        if (timeToken.startsWith('(') && timeToken.endsWith(')')) {
          timeToken = timeToken.slice(1, -1);
        }

        // Penalties: DNF or +2
        if (timeToken.startsWith('DNF(')) {
          penalty = 1;
          timeToken = timeToken.slice(4, -1);
        } else if (timeToken.endsWith('+')) {
          penalty = 2;
          timeToken = timeToken.slice(0, -1);
        }

        // Parse mm:ss.xx or ss.xx
        const parts = timeToken.split(':');
        let sec = 0;
        if (parts.length === 2) {
          sec = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
        } else if (parts.length === 1) {
          sec = parseFloat(parts[0]);
        }

        if (!isNaN(sec) && sec > 0) {
          parsed.push({
            time: Math.round(sec * 1000),
            penalty: penalty,
            comment: comment,
            scramble: '',
            date: Date.now()
          });
        }
      }

      return parsed;
    },

    /**
     * Sets up UI event listeners for Import/Export modals
     * @param {Object} dom DOM elements map
     * @param {Object} callbacks { getSolves, getSessionID, onImport, showToast, openModal, closeModal }
     */
    init: function (dom, callbacks) {
      if (dom.btnExport) {
        dom.btnExport.addEventListener('click', () => {
          const solves = callbacks.getSolves();
          const sessionID = callbacks.getSessionID();
          const exportText = ImportExport.formatForExport(solves, sessionID);
          if (dom.textarea) dom.textarea.value = exportText;
          if (dom.title) dom.title.textContent = `Export Solves (Session ${sessionID + 1})`;
          if (callbacks.openModal) callbacks.openModal(dom.modal);
        });
      }

      if (dom.btnImport) {
        dom.btnImport.addEventListener('click', () => {
          const sessionID = callbacks.getSessionID();
          if (dom.textarea) dom.textarea.value = '';
          if (dom.title) dom.title.textContent = `Import Solves to Session ${sessionID + 1}`;
          if (callbacks.openModal) callbacks.openModal(dom.modal);
        });
      }

      if (dom.btnExecute) {
        dom.btnExecute.addEventListener('click', () => {
          const text = dom.textarea ? dom.textarea.value.trim() : '';
          if (!text) return;

          const importedSolves = ImportExport.parseSolves(text);
          if (importedSolves.length > 0) {
            if (typeof callbacks.onImport === 'function') {
              callbacks.onImport(importedSolves);
            }
            if (callbacks.closeModal) callbacks.closeModal(dom.modal);
            if (callbacks.showToast) {
              callbacks.showToast(`Successfully imported ${importedSolves.length} solves!`);
            }
          } else {
            alert('No valid solves could be parsed. Please check the format.');
          }
        });
      }
    }
  };

  window.QQTimer.ImportExport = ImportExport;
})(window);
