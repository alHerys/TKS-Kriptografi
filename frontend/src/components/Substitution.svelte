<script>
  import Scene from './Scene.svelte';
  import { substitutionScene } from '../lib/scenes.js';
  let { step, progress } = $props();
  const scene = $derived(substitutionScene(step));
</script>

<Scene {scene} {progress} title={step.title} />
