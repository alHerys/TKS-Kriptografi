<script>
  import Scene from './Scene.svelte';
  import { vigenereScene } from '../lib/scenes.js';
  let { step, progress } = $props();
  const scene = $derived(vigenereScene(step));
</script>

<Scene {scene} {progress} title={step.title} />
