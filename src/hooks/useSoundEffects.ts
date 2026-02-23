import { useCallback, useRef } from 'react';

/**
 * Generates audio tones using the Web Audio API.
 * No external assets required.
 */
export const useSoundEffects = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = (): AudioContext => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  };

  const playTone = useCallback(
    (
      frequency: number,
      duration: number,
      type: OscillatorType = 'sine',
      volume = 0.3
    ) => {
      try {
        const ctx = getCtx();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
      } catch {
        /* ignore – audio not supported */
      }
    },
    []
  );

  const playBet = useCallback(() => {
    playTone(880, 0.08, 'square', 0.15);
  }, [playTone]);

  const playRoll = useCallback(() => {
    // Rapid ascending tones to simulate dice rolling
    const ctx = getCtx();
    const count = 8;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        playTone(200 + i * 80, 0.12, 'sawtooth', 0.1);
      }, i * 80);
    }
    void ctx;
  }, [playTone]);

  const playWin = useCallback(() => {
    // Cheerful ascending arpeggio
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, 'sine', 0.35), i * 120);
    });
  }, [playTone]);

  const playLose = useCallback(() => {
    // Descending sad tone
    const notes = [400, 300, 220];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.25, 'triangle', 0.2), i * 150);
    });
  }, [playTone]);

  return { playBet, playRoll, playWin, playLose };
};
