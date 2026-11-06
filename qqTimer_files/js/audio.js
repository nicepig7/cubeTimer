/**
 * QQTimer - Audio Module
 * Web Audio API synthesizer for timer feedback sounds.
 * Zero external audio files required.
 */

(function (window) {
  'use strict';

  window.QQTimer = window.QQTimer || {};

  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, type, duration, gainVal = 0.1) {
    const config = window.QQTimer.Config;
    if (config && !config.soundEnabled) return;

    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Graceful fallback for audio policy or unavailable device
    }
  }

  const Audio = {
    playTone: playTone,
    playSound: function (name) {
      const config = window.QQTimer.Config;
      if (config && !config.soundEnabled) return;

      switch (name) {
        case 'ready':
          playTone(880, 'sine', 0.12, 0.15); // Clear high-pitch beep for ready
          break;
        case 'start':
          playTone(1200, 'triangle', 0.08, 0.12); // Quick chirp for start
          break;
        case 'stop':
          playTone(600, 'sine', 0.15, 0.18); // Solid low-tone click for stop
          break;
        case 'warn':
          playTone(440, 'square', 0.2, 0.08); // Attention tone for 8s / 12s inspection
          break;
        default:
          break;
      }
    }
  };

  window.QQTimer.Audio = Audio;
})(window);
