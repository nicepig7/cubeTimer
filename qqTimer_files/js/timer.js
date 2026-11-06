/**
 * QQTimer - Timer Engine Module
 * High-precision timing engine using performance.now(), requestAnimationFrame,
 * and WCA 15-second inspection state machine.
 */

(function (window) {
  'use strict';

  window.QQTimer = window.QQTimer || {};

  const TimerState = {
    IDLE: 'idle',
    HOLDING: 'holding',
    READY: 'ready',
    RUNNING: 'running',
    INSPECTING: 'inspecting'
  };

  function createTimerEngine() {
    let currentState = TimerState.IDLE;
    let timerStartTime = 0;
    let timerEndTime = 0;
    let inspectionStartTime = 0;
    let animFrameId = null;
    let currentPenalty = 0; // 0: None, 1: DNF, 2: +2

    // Callbacks
    let callbacks = {
      onStateChange: null, // (newState, oldState)
      onTick: null,        // (elapsedMs, formattedStr, isInspection, secondsLeft)
      onSolveStart: null,  // ()
      onSolveStop: null    // (elapsedMs, penalty)
    };

    function setState(newState) {
      if (currentState === newState) return;
      const oldState = currentState;
      currentState = newState;
      if (typeof callbacks.onStateChange === 'function') {
        callbacks.onStateChange(newState, oldState);
      }
    }

    function startInspection() {
      cancelAnimationFrame(animFrameId);
      setState(TimerState.INSPECTING);
      inspectionStartTime = performance.now();
      currentPenalty = 0;

      let warned8 = false;
      let warned12 = false;

      function inspectionLoop() {
        if (currentState !== TimerState.INSPECTING && currentState !== TimerState.HOLDING) return;
        const elapsed = performance.now() - inspectionStartTime;
        const remaining = Math.max(0, 15000 - elapsed);
        const secondsLeft = Math.ceil(remaining / 1000);

        if (elapsed >= 8000 && !warned8) {
          warned8 = true;
          if (window.QQTimer.Audio) window.QQTimer.Audio.playSound('warn');
        }
        if (elapsed >= 12000 && !warned12) {
          warned12 = true;
          if (window.QQTimer.Audio) window.QQTimer.Audio.playSound('warn');
        }

        if (elapsed >= 17000) {
          currentPenalty = 1; // DNF
        } else if (elapsed >= 15000) {
          currentPenalty = 2; // +2
        }

        if (typeof callbacks.onTick === 'function') {
          callbacks.onTick(elapsed, secondsLeft, true, currentPenalty);
        }

        animFrameId = requestAnimationFrame(inspectionLoop);
      }
      inspectionLoop();
    }

    function startSolve() {
      cancelAnimationFrame(animFrameId);
      setState(TimerState.RUNNING);
      timerStartTime = performance.now();

      if (window.QQTimer.Audio) window.QQTimer.Audio.playSound('start');
      if (typeof callbacks.onSolveStart === 'function') {
        callbacks.onSolveStart();
      }

      function updateLoop() {
        if (currentState !== TimerState.RUNNING) return;
        const elapsed = performance.now() - timerStartTime;
        if (typeof callbacks.onTick === 'function') {
          callbacks.onTick(elapsed, null, false, 0);
        }
        animFrameId = requestAnimationFrame(updateLoop);
      }
      updateLoop();
    }

    function stopSolve() {
      cancelAnimationFrame(animFrameId);
      timerEndTime = performance.now();
      const elapsed = Math.round(timerEndTime - timerStartTime);

      setState(TimerState.IDLE);
      if (window.QQTimer.Audio) window.QQTimer.Audio.playSound('stop');

      if (typeof callbacks.onSolveStop === 'function') {
        callbacks.onSolveStop(elapsed, currentPenalty);
      }
      return { elapsed, penalty: currentPenalty };
    }

    function resetToIdle() {
      cancelAnimationFrame(animFrameId);
      currentPenalty = 0;
      setState(TimerState.IDLE);
    }

    return {
      TimerState: TimerState,
      setCallbacks: function (cbs) {
        callbacks = Object.assign(callbacks, cbs);
      },
      getState: function () {
        return currentState;
      },
      setState: setState,
      startInspection: startInspection,
      startSolve: startSolve,
      stopSolve: stopSolve,
      resetToIdle: resetToIdle,
      getCurrentPenalty: function () {
        return currentPenalty;
      },
      setPenalty: function (p) {
        currentPenalty = p;
      },
      getStartTime: function () {
        return timerStartTime;
      },
      getEndTime: function () {
        return timerEndTime;
      },
      getInspectionStartTime: function () {
        return inspectionStartTime;
      }
    };
  }

  window.QQTimer.TimerState = TimerState;
  window.QQTimer.TimerEngine = createTimerEngine();
})(window);
