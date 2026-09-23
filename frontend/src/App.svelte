<script>
  import { onMount } from 'svelte';
  import { createPlayback } from './lib/playback.svelte.js';
  import { highlightPython } from './lib/highlight.js';
  import { createTaskContext } from './lib/task-context.js';
  import TaskSummary from './components/TaskSummary.svelte';
  import TaskResult from './components/TaskResult.svelte';
  import Caesar from './components/Caesar.svelte';
  import Vigenere from './components/Vigenere.svelte';
  import Substitution from './components/Substitution.svelte';
  import Transposition from './components/Transposition.svelte';
  import Playfair from './components/Playfair.svelte';

  const views = {
    caesar: Caesar,
    vigenere: Vigenere,
    substitution: Substitution,
    transposition: Transposition,
    playfair: Playfair,
  };
  const phases = [
    { id: 'prepare', name: 'Persiapan' },
    { id: 'process', name: 'Proses' },
    { id: 'result', name: 'Hasil' },
  ];
  const player = createPlayback();
  let catalog = $state([]);
  let algorithm = $state('caesar');
  let mode = $state('encrypt');
  let text = $state('');
  let key = $state('');
  let tab = $state('visual');
  let run = $state(null);
  let source = $state(null);
  const sourceLines = $derived(source ? highlightPython(source.code) : []);
  let errors = $state({});
  let loading = $state(false);
  let catalogError = $state('');
  let sourceError = $state('');
  let stale = $state(false);
  let keyLoading = $state(false);
  let focused = $state(false);
  let theme = $state('system');
  let darkMode = $state(false);
  let revision = 0;
  let controller;
  let sourceController;
  let sourceRevision = 0;
  const selected = $derived(catalog.find((item) => item.id === algorithm));
  const task = $derived(run ? createTaskContext(run, selected.name) : null);
  const View = $derived(views[algorithm]);

  $effect(() => {
    if (!focused) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  });

  async function loadCatalog() {
    catalogError = '';
    try {
      const response = await fetch('/api/algorithms');
      if (!response.ok)
        throw new Error('Backend belum siap. Pastikan FastAPI berjalan lalu coba lagi.');
      catalog = await response.json();
      example();
    } catch (error) {
      catalogError = error.message || 'Tidak dapat terhubung ke backend.';
    }
  }

  function invalidate() {
    revision += 1;
    controller?.abort();
    loading = false;
    player.clear();
    stale = stale || run !== null;
    run = null;
    errors = {};
  }

  function example() {
    if (!selected) return;
    invalidate();
    text = mode === 'encrypt' ? selected.text : selected.ciphertext;
    key = String(selected.key);
  }

  function choose(id) {
    if (id === algorithm) return;
    invalidate();
    algorithm = id;
    mode = 'encrypt';
    const item = catalog.find((item) => item.id === id);
    text = item.text;
    key = String(item.key);
    stale = false;
    source = null;
    sourceError = '';
    if (tab === 'code') loadSource();
  }

  function changeMode(next) {
    if (next === mode) return;
    const previousResult = run?.output;
    invalidate();
    mode = next;
    // A completed computation may be reused without generating a new key.
    if (previousResult !== undefined) text = previousResult;
    else text = next === 'encrypt' ? selected.text : selected.ciphertext;
  }

  async function submit() {
    invalidate();
    stale = false;
    if (!text.length || text.length > 200) errors.text = 'Isi pesan dengan 1 sampai 200 karakter.';
    if (!key.trim()) errors.key = 'Kunci wajib diisi.';
    if (algorithm === 'caesar' && !/^[+-]?\d+$/.test(key.trim()))
      errors.key = 'Gunakan bilangan bulat.';
    if (Object.keys(errors).length) return;
    const token = revision;
    controller = new AbortController();
    loading = true;
    tab = 'visual';
    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          algorithm,
          mode,
          text,
          key: algorithm === 'caesar' ? Number(key) : key,
        }),
      });
      const data = await response.json();
      if (token !== revision) return;
      if (!response.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail
          : [{ msg: 'Proses gagal. Periksa input dan coba lagi.' }];
        errors = Object.fromEntries(detail.map((item) => [item.loc?.[1] ?? 'general', item.msg]));
        return;
      }
      run = data;
      player.load(data.steps, data.algorithm);
    } catch (error) {
      if (error.name !== 'AbortError' && token === revision)
        errors.general = 'Tidak dapat menghubungi server. Input kamu tetap tersimpan; coba lagi.';
    } finally {
      if (token === revision) loading = false;
    }
  }

  async function generateKey() {
    invalidate();
    const token = revision;
    keyLoading = true;
    try {
      const response = await fetch('/api/substitution/key', { method: 'POST' });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (token === revision && algorithm === 'substitution') key = data.key;
    } catch {
      if (token === revision) errors.key = 'Gagal membuat kunci. Coba lagi.';
    } finally {
      keyLoading = false;
    }
  }

  async function loadSource() {
    const token = ++sourceRevision;
    sourceController?.abort();
    sourceController = new AbortController();
    source = null;
    sourceError = '';
    try {
      const response = await fetch('/api/source/' + algorithm, { signal: sourceController.signal });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (token === sourceRevision) source = data;
    } catch (error) {
      if (error.name !== 'AbortError' && token === sourceRevision)
        sourceError = 'Kode tidak dapat dimuat. Coba lagi.';
    }
  }

  function openTab(next) {
    tab = next;
    if (next === 'code') {
      player.pause();
      loadSource();
    }
  }

  function jump(phase) {
    const index = player.steps.findIndex((step) => step.phase === phase);
    if (index >= 0) player.seek(index);
  }

  function applyTheme(value, persist = true) {
    theme = value;
    if (value === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = value;
    darkMode =
      value === 'mocha' ||
      (value === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.querySelector('meta[name="theme-color"]').content = darkMode ? '#181825' : '#e6e9ef';
    if (persist) {
      try {
        if (value === 'system') localStorage.removeItem('crypto-theme');
        else localStorage.setItem('crypto-theme', value);
      } catch {
        // The selection still works for this visit when storage is unavailable.
      }
    }
  }

  onMount(() => {
    loadCatalog();
    const themeMedia = matchMedia('(prefers-color-scheme: dark)');
    applyTheme(document.documentElement.dataset.theme ?? 'system', false);
    const updateSystemTheme = () => applyTheme(theme, false);
    themeMedia.addEventListener('change', updateSystemTheme);
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => player.setReducedMotion(media.matches);
    updateMotion();
    media.addEventListener('change', updateMotion);
    return () => {
      revision++;
      sourceRevision++;
      controller?.abort();
      sourceController?.abort();
      player.destroy();
      media.removeEventListener('change', updateMotion);
      themeMedia.removeEventListener('change', updateSystemTheme);
    };
  });
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'Escape') focused = false;
  }}
/>

<svelte:head><title>{selected ? selected.name + ' · ' : ''}Lab Kriptografi</title></svelte:head>

{#if !focused}
  <button
    class="theme-toggle"
    type="button"
    aria-label={darkMode ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
    title={darkMode ? 'Mode terang · Latte' : 'Mode gelap · Mocha'}
    onclick={() => applyTheme(darkMode ? 'latte' : 'mocha')}
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {#if darkMode}
        <circle cx="12" cy="12" r="4" />
        <path
          d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"
        />
      {:else}
        <path d="M20.9 13.2A9 9 0 0 1 10.8 3.1 9 9 0 1 0 20.9 13.2Z" />
      {/if}
    </svg>
  </button>
{/if}

<div class="app-shell">
  <main>
    {#if catalogError}
      <div class="connection-error" role="alert">
        <p>{catalogError}</p>
        <button onclick={loadCatalog}>Coba lagi</button>
      </div>
    {:else if !catalog.length}
      <div class="loading-skeleton" aria-label="Memuat algoritma">
        <div></div>
        <div></div>
        <div></div>
      </div>
    {:else}
      <div class="top-bar" inert={focused}>
        <nav class="algorithm-nav" aria-label="Pilih algoritma">
          {#each catalog as item (item.id)}
            <button
              class:active={algorithm === item.id}
              aria-pressed={algorithm === item.id}
              onclick={() => choose(item.id)}
            >
              {item.name}
            </button>
          {/each}
        </nav>
      </div>

      <div class="workspace">
        <aside class="input-panel" inert={focused}>
          <div class="algorithm-heading">
            <p class="eyebrow">{selected.category}</p>
            <h2>{selected.name}<span class="heading-dot">.</span></h2>
            <p>{selected.description}</p>
          </div>
          <form
            onsubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <fieldset class="mode-switch">
              <legend class="sr-only">Mode operasi</legend>
              <button
                type="button"
                class:chosen={mode === 'encrypt'}
                aria-pressed={mode === 'encrypt'}
                onclick={() => changeMode('encrypt')}>Enkripsi</button
              >
              <button
                type="button"
                class:chosen={mode === 'decrypt'}
                aria-pressed={mode === 'decrypt'}
                onclick={() => changeMode('decrypt')}>Dekripsi</button
              >
            </fieldset>
            <div class="field">
              <div class="field-top">
                <label for="message">{mode === 'encrypt' ? 'Pesan asli' : 'Ciphertext'}</label
                ><button class="text-button" type="button" onclick={example}>Pakai contoh</button>
              </div>
              <textarea
                id="message"
                bind:value={text}
                oninput={invalidate}
                maxlength="200"
                rows="4"
                spellcheck="false"
                aria-invalid={!!errors.text}
                aria-describedby="text-help text-error"></textarea>
              <div class="field-bottom" id="text-help">
                <span>Huruf, angka, spasi, tanda baca</span><span>{text.length}/200</span>
              </div>
              <p id="text-error" class="field-error">{errors.text ?? ''}</p>
            </div>
            <div class="field">
              <div class="field-top">
                <label for="key">{algorithm === 'caesar' ? 'Kunci pergeseran' : 'Kunci'}</label>
                {#if algorithm === 'substitution'}<button
                    class="text-button"
                    type="button"
                    disabled={keyLoading}
                    onclick={generateKey}>{keyLoading ? 'Membuat…' : 'Acak kunci'}</button
                  >{/if}
              </div>
              <input
                id="key"
                type="text"
                inputmode={algorithm === 'caesar' ? 'numeric' : 'text'}
                bind:value={key}
                oninput={invalidate}
                spellcheck="false"
                maxlength={algorithm === 'caesar' ? 9 : 32}
                aria-invalid={!!errors.key}
                aria-describedby="key-help key-error"
              />
              <p id="key-help" class="field-help">{selected.key_hint}</p>
              <p id="key-error" class="field-error">{errors.key ?? ''}</p>
            </div>
            {#if errors.general}<p class="field-error" role="alert">{errors.general}</p>{/if}
            <button class="primary process-button" type="submit" disabled={loading}
              >{loading ? 'Menyiapkan langkah…' : 'Proses pesan'}<span aria-hidden="true">↗</span
              ></button
            >
          </form>
          <div class="behavior-notes">
            <h3>Yang perlu diketahui</h3>
            {#each selected.notes as note}<p>{note}</p>{/each}
          </div>
        </aside>

        <section class="visual-panel" class:focused aria-label="Eksplorasi algoritma">
          <div class="panel-header">
            <div class="view-tabs" role="group" aria-label="Tampilan">
              <button
                class:active={tab === 'visual'}
                aria-pressed={tab === 'visual'}
                onclick={() => openTab('visual')}>Visualisasi</button
              >
              <button
                class:active={tab === 'code'}
                aria-pressed={tab === 'code'}
                onclick={() => openTab('code')}
                >Kode Python<span class="code-symbol" aria-hidden="true">&lt;/&gt;</span></button
              >
            </div>
            <div class="panel-tools">
              {#if focused}<span class="panel-caption"
                  >{tab === 'code'
                    ? 'FILE ASLI'
                    : mode === 'encrypt'
                      ? 'ENKRIPSI'
                      : 'DEKRIPSI'}</span
                >{/if}
              <button
                class="focus-button"
                type="button"
                aria-label={focused ? 'Tutup fokus' : 'Fokus'}
                title={focused ? 'Keluar dari mode fokus' : 'Perbesar visualisasi'}
                aria-pressed={focused}
                onclick={() => (focused = !focused)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  {#if focused}
                    <path d="M9 3v6H3m18 0h-6V3M3 15h6v6m6 0v-6h6" />
                  {:else}
                    <path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6" />
                  {/if}
                </svg>
              </button>
            </div>
          </div>

          {#if task}<TaskSummary {task} />{/if}

          {#if tab === 'code'}
            <div class="source-panel">
              {#if sourceError}<div role="alert">
                  <p>{sourceError}</p>
                  <button onclick={loadSource}>Coba lagi</button>
                </div>
              {:else if !source}<p class="source-loading">Memuat kode Python…</p>
              {:else}
                <div class="source-meta">
                  <strong>{source.path}</strong><span
                    >Python · {source.code.split('\n').length - 1} baris</span
                  >
                </div>
                <p class="source-note">
                  Versi CLI dari folder legacy, tanpa pencatatan langkah. Visualisasi memakai versi
                  di folder algorithms.
                </p>
                <!-- svelte-ignore a11y_no_noninteractive_tabindex (Scrollable code must be keyboard accessible.) -->
                <div class="code-scroll" tabindex="0" role="region" aria-label="Kode Python asli">
                  <pre><code
                      >{#each sourceLines as line, i}<span class="code-line"
                          ><span class="line-number" aria-hidden="true">{i + 1}</span><span
                            >{#each line as token}<span class={token.classes}>{token.text}</span
                              >{:else}{' '}{/each}</span
                          ></span
                        >{/each}</code
                    ></pre>
                </div>
              {/if}
            </div>
          {:else if loading}
            <div class="stage-loading" role="status">
              <div class="loading-skeleton">
                <div></div>
                <div></div>
                <div></div>
              </div>
              <p>Menyiapkan langkah perhitungan…</p>
            </div>
          {:else if player.step}
            <div class="step-explanation">
              <div class="step-meta">
                <span class="step-count">Langkah {player.index + 1} dari {player.steps.length}</span
                >
                <span aria-hidden="true">·</span>
                <select
                  class="phase-select"
                  aria-label="Fase algoritma"
                  value={player.step.phase}
                  onchange={(event) => jump(event.currentTarget.value)}
                >
                  {#each phases as phase}
                    <option value={phase.id}>{phase.name}</option>
                  {/each}
                </select>
              </div>
              <div aria-live="polite" aria-atomic="true">
                <h3>{task.entries[player.index].title}</h3>
                <p>{task.entries[player.index].context} {player.step.explanation}</p>
              </div>
            </div>
            <div class="playback">
              <div class="playback-controls" role="group" aria-label="Kontrol pemutaran">
                <div class="transport">
                  <button
                    aria-label="Langkah sebelumnya"
                    title="Langkah sebelumnya"
                    disabled={player.index === 0}
                    onclick={() => player.previous()}
                    ><span class="step-arrow" aria-hidden="true">←</span><span>Sebelumnya</span
                    ></button
                  >
                  <button
                    class="play-button"
                    aria-label={player.playing ? 'Pause' : 'Play'}
                    disabled={player.index === player.steps.length - 1 && player.progress >= 1}
                    onclick={() => player.toggle()}
                    >{player.playing ? 'Ⅱ' : '▶'}<span>{player.playing ? 'Pause' : 'Play'}</span
                    ></button
                  >
                  <button
                    aria-label="Langkah berikutnya"
                    title="Langkah berikutnya"
                    disabled={player.index === player.steps.length - 1 && player.progress >= 1}
                    onclick={() => player.next()}
                    ><span>Berikutnya</span><span class="step-arrow" aria-hidden="true">→</span
                    ></button
                  >
                </div>
                <div class="playback-options">
                  <button class="reset-button" onclick={() => player.reset()}>Reset</button>
                  <label class="speed-control"
                    ><span class="sr-only">Kecepatan</span><select
                      aria-label="Kecepatan"
                      value={String(player.speed)}
                      onchange={(event) => player.setSpeed(event.currentTarget.value)}
                      ><option value="0.5">0,5×</option><option value="1">1×</option><option
                        value="2">2×</option
                      ></select
                    ></label
                  >
                </div>
              </div>
            </div>
            <div
              class="stage"
              data-testid="stage"
              data-step={player.index}
              data-progress={player.progress.toFixed(3)}
              data-holding={player.holding}
            >
              <View step={player.step} progress={player.visualProgress} />
            </div>
            <TaskResult {task} index={player.index} progress={player.progress} />
          {:else}
            <div class="empty-stage">
              <div class="empty-letters" aria-hidden="true">
                <span>A</span><span>B</span><span>C</span><span class="empty-arrow">→</span><span
                  class="empty-question">?</span
                >
              </div>
              <p class="eyebrow">SATU LANGKAH, SATU PEMAHAMAN.</p>
              <h3>{stale ? 'Input berubah. Mari hitung lagi.' : 'Pesanmu punya perjalanan.'}</h3>
              <p>
                {stale
                  ? 'Tekan Proses pesan untuk menyiapkan visualisasi dari input terbaru.'
                  : 'Siapkan pesan dan kunci, lalu tekan Proses pesan. Kamu bisa mengendalikan setiap langkahnya.'}
              </p>
              <div class="empty-phases">
                <span>01 Persiapan</span><span>02 Proses</span><span>03 Hasil</span>
              </div>
            </div>
          {/if}
        </section>
      </div>
    {/if}
  </main>
</div>

<footer class="site-footer" inert={focused}>
  <p>made with ❤️ by Dion, Keihan, Hery, Dhyty, and Rakhman</p>
</footer>
