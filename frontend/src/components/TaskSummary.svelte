<script>
  import { showCharacter } from '../lib/task-context.js';
  let { task } = $props();
</script>

<section class="task-summary" aria-label="Tujuan tugas">
  <div class="task-heading">
    <h3>{task.title}</h3>
    <p>{task.goal}</p>
  </div>
  <div class="task-parameters">
    <p class="task-message">
      <span>{task.run.mode === 'decrypt' ? 'Ciphertext' : 'Pesan awal'}</span><code
        title={task.run.input}>{task.run.input.replace(/[\n\r\t]/g, showCharacter)}</code
      >
    </p>
    <p class="task-key"><span>Kunci</span><code>{task.run.key}</code></p>
  </div>
  <p class="task-rule">{task.rule}</p>
</section>
