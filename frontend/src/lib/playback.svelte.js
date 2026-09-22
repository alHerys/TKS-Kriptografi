import { tick } from 'svelte';
import { gsap } from 'gsap';

/** One controller for every algorithm. GSAP owns only a progress value.
 * The visible snapshot is a pure function of step + progress, so seeking
 * backwards never depends on animation callbacks having run before.
 */
export function createPlayback() {
  let steps = $state([]);
  let index = $state(0);
  let progress = $state(0);
  let playing = $state(false);
  let speed = $state(1);
  let reducedMotion = $state(false);
  let holding = $state(false);
  let algorithm;
  let continuousMode = false;
  let timeline;
  let generation = 0;

  function kill() {
    generation += 1;
    timeline?.kill();
    timeline = undefined;
    playing = false;
    holding = false;
  }

  function seek(next) {
    kill();
    index = Math.max(0, Math.min(next, steps.length - 1));
    progress = 0;
  }

  async function animate(continuous) {
    if (!steps.length) return;
    if (progress >= 1) {
      if (index >= steps.length - 1) return;
      index += 1;
      progress = 0;
    }
    kill();
    continuousMode = continuous;
    playing = true;
    const token = generation;
    await tick();
    if (token !== generation) return;
    const cursor = { value: progress };
    timeline = gsap.timeline({
      onUpdate: () => {
        progress = cursor.value;
      },
      onComplete: () => {
        progress = 1;
        playing = false;
        holding = false;
        if (continuousMode && index < steps.length - 1 && token === generation) animate(true);
      },
    });
    // Labels divide each algorithm operation into input, rule, movement, result.
    timeline
      .to(cursor, {
        value: 1,
        duration: (reducedMotion ? 0.5 : 2.4) * (1 - progress),
        ease: 'none',
      })
      .addLabel('input', 0)
      .addLabel('rule', 0.5)
      .addLabel('move', 0.85)
      .addLabel('result', 2.1);
    // Give the audience time to read the completed Vigenere arithmetic.
    // Keep this inside GSAP so pause, speed changes and skip also control the hold.
    if (algorithm === 'vigenere' && steps[index].kind === 'letter') {
      timeline
        .call(() => {
          holding = true;
        })
        .to({}, { duration: 1 });
    }
    timeline.timeScale(speed);
  }

  return {
    get steps() {
      return steps;
    },
    get index() {
      return index;
    },
    get progress() {
      return progress;
    },
    get visualProgress() {
      return reducedMotion ? 1 : progress;
    },
    get playing() {
      return playing;
    },
    get holding() {
      return holding;
    },
    get speed() {
      return speed;
    },
    get step() {
      return steps[index];
    },
    get output() {
      return progress >= 0.88 ? (steps[index]?.output ?? '') : (steps[index - 1]?.output ?? '');
    },
    load(nextSteps, nextAlgorithm) {
      kill();
      algorithm = nextAlgorithm;
      steps = nextSteps;
      index = 0;
      progress = 0;
    },
    clear() {
      kill();
      steps = [];
      index = 0;
      progress = 0;
    },
    seek,
    reset() {
      seek(0);
    },
    previous() {
      seek(index - 1);
    },
    next() {
      if (holding || (progress < 1 && (playing || progress > 0))) {
        // Finish the current snapshot without firing autoplay's completion callback.
        kill();
        continuousMode = false;
        progress = 1;
        return;
      }
      return animate(false);
    },
    toggle() {
      if (playing) {
        timeline?.pause();
        playing = false;
      } else if (timeline && (progress < 1 || holding)) {
        continuousMode = true;
        timeline.resume();
        playing = true;
      } else animate(true);
    },
    pause() {
      timeline?.pause();
      playing = false;
    },
    setSpeed(value) {
      speed = Number(value);
      timeline?.timeScale(speed);
    },
    setReducedMotion(value) {
      reducedMotion = value;
    },
    destroy: kill,
  };
}
