<script>
  import Scene from './Scene.svelte';
  import { transpositionScene } from '../lib/scenes.js';
  let { step, progress } = $props();
  const scene = $derived(transpositionScene(step));
</script>

<Scene {scene} {progress} title={step.title} />
