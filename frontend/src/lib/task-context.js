// Presentation only: mappings and results come from the Python trace.
export const showCharacter = (text) =>
  [...text].map((char) => ({ ' ': '␣', '\n': '↵', '\r': '↵', '\t': '⇥' })[char] ?? char).join('');

const describe = (text) => (text === ' ' ? 'spasi' : `“${showCharacter(text)}”`);

export function createTaskContext(run, name) {
  const operations = run.steps
    .map((step, index) => ({ ...step, traceIndex: index }))
    .filter((step) => step.phase === 'process');
  const transposition = run.algorithm === 'transposition';
  const paired = run.algorithm === 'playfair';
  const fills = operations.filter((step) => step.kind === 'fill');
  const reads = operations.filter((step) => step.kind === 'read');
  const inputs = (transposition ? fills : operations).map((step) => step.data.input);
  const sourceByCell = new Map(fills.map((step, index) => [step.data.cell, index]));
  const letters = operations.filter((step) => step.kind === 'letter');
  const firstLetter = letters[0]?.data;
  const decrypt = run.mode === 'decrypt';
  const rules = {
    caesar: firstLetter
      ? `Geser setiap huruf ${firstLetter.distance} posisi ke ${firstLetter.direction === 1 ? 'kanan' : 'kiri'}. Spasi dan tanda baca tetap.`
      : 'Tidak ada huruf yang perlu digeser. Karakter lainnya tetap dipertahankan.',
    vigenere: `Geser setiap huruf ke ${decrypt ? 'kiri' : 'kanan'} mengikuti kunci yang berulang; spasi tidak menghabiskan kunci.`,
    substitution: `Ganti setiap huruf mengikuti ${decrypt ? 'peta kunci terbalik' : 'peta kunci'}. Pesan diproses dalam huruf kapital.`,
    playfair: `Ubah dua huruf sekaligus memakai matriks kunci 5 × 5.${decrypt ? ' Filler X/Q tetap disimpan.' : ''}`,
    transposition: decrypt
      ? 'Isi kolom menurut urutan kunci, lalu baca per baris untuk memulihkan pesan.'
      : 'Isi pesan per baris, lalu baca kolom menurut urutan kunci. Huruf berpindah posisi.',
  };
  const entries = run.steps.map((step, traceIndex) => {
    const d = step.data;
    const entry = { title: step.title, context: '', source: null, target: null };
    if (step.phase === 'prepare') {
      entry.context = 'Menyiapkan aturan dan pesan sebelum mengisi hasil.';
    } else if (step.phase === 'result') {
      entry.context =
        step.kind === 'cleanup'
          ? 'Tahap akhir: ubah _ menjadi spasi dan hapus seluruh X di akhir sesuai kode lama.'
          : `Semua ${paired ? 'pasangan' : 'karakter'} sudah diproses. Gabungkan hasilnya.`;
    } else if (step.kind === 'letter' || step.kind === 'skip') {
      entry.source = entry.target = d.index;
      entry.title =
        step.kind === 'skip'
          ? `Pertahankan ${describe(d.input)}`
          : `Ubah ${d.input} menjadi ${d.output}`;
      entry.context =
        step.kind === 'skip'
          ? `Karakter ${d.index + 1} dari ${inputs.length}, tidak memerlukan penggantian.`
          : `Huruf ${letters.findIndex((item) => item.traceIndex === traceIndex) + 1} dari ${letters.length}${d.key_char ? `, memakai huruf kunci ${d.key_char}` : ''}.`;
    } else if (step.kind === 'pair') {
      entry.source = entry.target = d.index;
      entry.title = `Ubah pasangan ${d.input} menjadi ${d.output}`;
      entry.context = `Pasangan ${d.index + 1} dari ${inputs.length}, bukan satu huruf terpisah.`;
    } else if (step.kind === 'fill') {
      entry.source = fills.findIndex((item) => item.traceIndex === traceIndex);
      entry.title = `Tempatkan ${describe(d.input)} ke matriks`;
      entry.context = `Karakter ${entry.source + 1} dari ${inputs.length} → baris ${Math.floor(d.cell / d.cols) + 1}, kolom ${(d.cell % d.cols) + 1}. Hasil belum dibaca.`;
    } else if (step.kind === 'read') {
      entry.source = sourceByCell.get(d.cell);
      entry.target = reads.findIndex((item) => item.traceIndex === traceIndex);
      entry.title = `Pindahkan ${describe(d.input)} ke hasil`;
      entry.context = `Posisi sumber ${entry.source + 1} → posisi hasil ${entry.target + 1} dari ${inputs.length}.`;
    }
    return entry;
  });
  return {
    run,
    name,
    inputs,
    entries,
    paired,
    transposition,
    title: `${decrypt ? 'Dekripsi' : 'Enkripsi'} · ${name}`,
    goal: decrypt ? 'Pulihkan pesan dari ciphertext.' : 'Ubah pesan menjadi ciphertext.',
    rule: rules[run.algorithm],
  };
}

export function taskSnapshot(task, index, revealed) {
  const step = task.run.steps[index];
  const preparing = step.phase === 'prepare';
  const complete = step.phase === 'result' && revealed;
  const inputs = preparing ? [...task.run.input] : task.inputs;
  const output = task.run.steps[index - (revealed ? 0 : 1)]?.output ?? '';
  const entry = task.entries[index];
  const size = !preparing && task.paired ? 2 : 1;
  const completedSources = new Set();
  // During matrix filling, mark placed input. During reading, mark consumed input.
  for (let i = 0; i <= index - (revealed ? 0 : 1); i++) {
    const candidate = task.run.steps[i];
    if (candidate.phase !== 'process') continue;
    if (task.transposition && candidate.kind !== (step.kind === 'fill' ? 'fill' : 'read')) continue;
    completedSources.add(task.entries[i].source);
  }
  let note = '';
  if (preparing) note = 'Hasil belum diisi; pesan asli ditampilkan selama persiapan.';
  else if (task.transposition)
    note =
      task.run.mode === 'decrypt'
        ? 'Posisi sumber dan hasil berbeda. Pada tahap akhir, _ menjadi spasi dan seluruh X di akhir dihapus.'
        : 'Posisi sumber dan hasil berbeda. Spasi ditulis sebagai _; X digunakan bila matriks perlu dilengkapi.';
  else if (task.paired)
    note =
      task.run.mode === 'decrypt'
        ? 'Setiap kolom adalah satu pasangan huruf. Filler X/Q tetap disimpan pada hasil.'
        : 'Setiap kolom adalah satu pasangan siap proses: J menjadi I, tanda baca diabaikan, filler X/Q disisipkan bila perlu.';
  else if (inputs.join('') !== task.run.input)
    note = 'Pesan diproses dalam huruf kapital; pesan asli tetap terlihat di ringkasan tugas.';
  return {
    output,
    complete,
    note,
    sourceLabel:
      !preparing && inputs.join('') !== task.run.input
        ? 'Siap proses'
        : task.run.mode === 'decrypt'
          ? 'Ciphertext awal'
          : 'Pesan awal',
    cells: inputs.map((input, position) => ({
      input,
      output: output.slice(position * size, (position + 1) * size),
      placeholder: '·'.repeat(size),
      sourceActive: !preparing && entry.source === position,
      targetActive: !preparing && entry.target === position,
      done: complete || completedSources.has(position),
      removed: complete && position * size >= output.length,
    })),
  };
}
