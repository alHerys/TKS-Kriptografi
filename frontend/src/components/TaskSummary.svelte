<script>
  import { showCharacter } from '../lib/task-context.js';
  let { task } = $props();
</script>

<section class="task-summary" aria-label="Pesan masukan">
  <p class="task-message">
    <span>{task.run.mode === 'decrypt' ? 'Ciphertext' : 'Pesan awal'}</span><code
      title={task.run.input}>{task.run.input.replace(/[\n\r\t]/g, showCharacter)}</code
    >
  </p>
</section>
