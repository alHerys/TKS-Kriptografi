<script>
  import { taskSnapshot, showCharacter } from '../lib/task-context.js';
  let { task, index, progress } = $props();
  let scroller;
  const revealed = $derived(progress >= 0.88);
  const snapshot = $derived(taskSnapshot(task, index, revealed));

  $effect(() => {
    const position = snapshot.cells.findIndex((cell) => cell.targetActive);
    const active = position >= 0 ? position : snapshot.cells.findIndex((cell) => cell.sourceActive);
    if (active < 0 && scroller) scroller.scrollLeft = 0;
    const cell = scroller?.children[active];
    if (!cell) return;
    const bounds = cell.getBoundingClientRect();
    const viewport = scroller.getBoundingClientRect();
    if (bounds.left < viewport.left || bounds.right > viewport.right) {
      scroller.scrollLeft += bounds.left - viewport.left - (viewport.width - bounds.width) / 2;
    }
  });
</script>

<section class="output-panel" aria-label="Hubungan pesan dan hasil">
  <div class="output-heading">
    <h3>{snapshot.complete ? 'Hasil akhir' : 'Hasil sementara'}</h3>
    <span>{task.run.mode === 'encrypt' ? 'CIPHERTEXT' : 'PLAINTEXT'}</span>
  </div>
  <div class="comparison">
    <div class="comparison-labels" aria-hidden="true">
      <span>{snapshot.sourceLabel}</span><span>Hasil</span>
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (Long comparisons can be scrolled with the keyboard.) -->
    <div
      class="comparison-scroll"
      bind:this={scroller}
      tabindex="0"
      role="region"
      aria-label={`${snapshot.sourceLabel} dan hasil per posisi`}
    >
      {#each snapshot.cells as cell, position}
        <div class="comparison-slot">
          <span
            class="comparison-cell source-cell"
            class:active={cell.sourceActive}
            class:done={cell.done}
            data-active={cell.sourceActive}
            title={`${snapshot.sourceLabel}, posisi ${position + 1}: ${showCharacter(cell.input)}`}
            >{showCharacter(cell.input)}</span
          >
          <span
            class="comparison-cell result-cell"
            class:active={cell.targetActive}
            class:pending={!cell.output && !cell.removed}
            class:removed={cell.removed}
            data-active={cell.targetActive}
            title={cell.removed
              ? 'Dihapus saat pembersihan padding'
              : `Hasil, posisi ${position + 1}: ${cell.output ? showCharacter(cell.output) : 'belum diproses'}`}
            >{cell.removed
              ? '×'
              : cell.output
                ? showCharacter(cell.output)
                : cell.placeholder}</span
          >
        </div>
      {/each}
    </div>
  </div>
  <p class="comparison-legend">␣ spasi · titik kecil: belum diproses · garis tebal: bagian aktif</p>
  {#if snapshot.note}<p class="comparison-note">{snapshot.note}</p>{/if}
  <output class="sr-only" data-testid="output" aria-label="Hasil perhitungan"
    >{snapshot.output || (snapshot.complete ? '' : '…')}</output
  >
  {#if snapshot.complete && snapshot.output === ''}
    <p class="field-help">Hasil berupa teks kosong setelah pembersihan padding.</p>
  {/if}
</section>
