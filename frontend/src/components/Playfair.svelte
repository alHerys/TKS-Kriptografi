<script>
  import Scene from './Scene.svelte';
  import { playfairScene } from '../lib/scenes.js';
  let { step, progress } = $props();
  const scene = $derived(playfairScene(step));
</script>

<Scene {scene} {progress} title={step.title} />
