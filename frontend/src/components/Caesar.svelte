<script>
  import Scene from './Scene.svelte';
  import { caesarScene } from '../lib/scenes.js';
  let { step, progress } = $props();
  const scene = $derived(caesarScene(step));
</script>

<Scene {scene} {progress} title={step.title} />
