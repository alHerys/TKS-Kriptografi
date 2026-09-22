/** @typedef {import('./types.js').Scene} Scene */
export const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const visible = (char) =>
  char === ' ' ? '·' : char === '\n' ? '↵' : char === '\r' ? '↵' : char === '\t' ? '⇥' : char;
export const point = (x, y) => ({ x, y });
export const cell = (id, text, x, y, role = '', extra = {}) => ({
  id,
  text: visible(text),
  x,
  y,
  role,
  ...extra,
});

/** Text preparation is shown from the Python snapshot, never recalculated. */
export function textScene(step) {
  const data = step.data;
  const cells = [],
    labels = [],
    movers = [];
  let y = 62;
  function line(text, label, reveal = false) {
    labels.push({ x: 34, y: y - 24, text: label });
    [...String(text)].forEach((char, i) => {
      cells.push(
        cell(
          label + i,
          char,
          34 + (i % 16) * 46,
          y + Math.floor(i / 16) * 54,
          reveal ? 'target' : '',
          { reveal },
        ),
      );
    });
    y += Math.max(1, Math.ceil(String(text).length / 16)) * 54 + 58;
  }
  if (data.original !== undefined) line(data.original, 'Teks awal');
  if (step.kind === 'skip') {
    line(data.input, 'Karakter yang dipertahankan');
    labels.push({ x: 34, y, text: 'Tanpa transformasi. Posisi karakter tetap dipertahankan.' });
  } else
    line(
      data.text ?? data.input ?? '',
      step.phase === 'result' ? 'Hasil akhir' : 'Hasil persiapan',
      true,
    );
  return { width: 800, height: Math.max(280, y), cells, labels, movers, formula: data.formula };
}

export function caesarScene(step) {
  if (!['letter', 'shift'].includes(step.kind)) return textScene(step);
  const d = step.data,
    cells = [],
    labels = [],
    movers = [];
  labels.push({ x: 34, y: 35, text: 'ALFABET  /  A = 0, Z = 25' });
  [...alphabet].forEach((char, i) =>
    cells.push(
      cell(
        'alphabet' + i,
        char,
        34 + (i % 13) * 57,
        72 + Math.floor(i / 13) * 80,
        i === d.source ? 'source' : i === d.target ? 'target' : '',
        { label: String(i) },
      ),
    ),
  );
  if (step.kind === 'letter') {
    const from = point(34 + (d.source % 13) * 57, 72 + Math.floor(d.source / 13) * 80);
    const to = point(34 + (d.target % 13) * 57, 72 + Math.floor(d.target / 13) * 80);
    // Show every alphabet position, including the Z -> A boundary.
    const via = [];
    for (let n = 1; n < d.distance; n++) {
      const index = (d.source + d.direction * n + 26) % 26;
      via.push(point(34 + (index % 13) * 57, 72 + Math.floor(index / 13) * 80));
    }
    movers.push({ text: d.input, from, to, via });
    cells.push(cell('out', d.output, 378, 268, 'target', { reveal: true }));
    labels.push({ x: 378, y: 239, text: 'HURUF HASIL', anchor: 'middle' });
  } else
    labels.push({ x: 34, y: 264, text: 'Geser ' + d.shift + ' posisi untuk setiap huruf pesan.' });
  return { width: 800, height: 326, cells, movers, labels, formula: d.formula };
}

export function vigenereScene(step) {
  if (!['alignment', 'letter', 'skip'].includes(step.kind)) return textScene(step);
  const d = step.data,
    cells = [],
    movers = [],
    labels = [];
  if (step.kind === 'alignment') {
    for (let start = 0; start < d.text.length; start += 12) {
      const y = 60 + Math.floor(start / 12) * 170;
      labels.push({ x: 34, y: y - 30, text: 'PESAN / POSISI ' + (start + 1) });
      labels.push({ x: 34, y: y + 40, text: 'KUNCI BERULANG' });
      [...d.text.slice(start, start + 12)].forEach((char, i) => {
        cells.push(cell('text' + (start + i), char, 34 + i * 61, y));
        cells.push(
          cell('key' + (start + i), d.aligned[start + i], 34 + i * 61, y + 75, 'target', {
            reveal: true,
          }),
        );
      });
    }
    return {
      width: 800,
      height: Math.max(280, Math.ceil(d.text.length / 12) * 170 + 20),
      cells,
      movers,
      labels,
    };
  }
  // A window keeps long messages legible while preserving their absolute index.
  const start = Math.max(0, Math.floor((d.index ?? 0) / 12) * 12);
  const text = d.text.slice(start, start + 12),
    aligned = d.aligned.slice(start, start + 12);
  labels.push({
    x: 34,
    y: 30,
    text: 'PESAN  /  posisi ' + (start + 1) + '–' + (start + text.length),
  });
  labels.push({ x: 34, y: 132, text: 'KUNCI BERULANG' });
  [...text].forEach((char, i) =>
    cells.push(cell('text' + i, char, 34 + i * 61, 64, i + start === d.index ? 'source' : '')),
  );
  [...aligned].forEach((char, i) =>
    cells.push(
      cell('key' + i, char, 34 + i * 61, 170, i + start === d.index ? 'target' : '', {
        reveal: step.kind === 'alignment',
      }),
    ),
  );
  if (step.kind === 'letter') {
    const x = 34 + (d.index - start) * 61;
    movers.push({ text: d.input, from: point(x, 64), to: point(300, 280) });
    movers.push({ text: d.key_char, from: point(x, 170), to: point(430, 280) });
    cells.push(cell('output', d.output, 660, 280, 'target', { reveal: true }));
    labels.push({ x: 365, y: 287, text: d.direction === 1 ? '+' : '−', anchor: 'middle' });
    labels.push({ x: 546, y: 287, text: 'mod 26 →', anchor: 'middle' });
  }
  return { width: 800, height: 340, cells, movers, labels, formula: d.formula };
}

export function substitutionScene(step) {
  if (!['mapping', 'letter', 'skip'].includes(step.kind)) return textScene(step);
  const d = step.data,
    cells = [],
    labels = [],
    movers = [];
  [0, 13].forEach((start, group) => {
    const y = 60 + group * 165;
    labels.push({ x: 34, y: y - 28, text: 'ASAL' }, { x: 34, y: y + 40, text: 'PENGGANTI' });
    for (let i = start; i < start + 13; i++) {
      const x = 34 + (i - start) * 57;
      cells.push(cell('source' + i, d.source_alphabet[i], x, y, i === d.source ? 'source' : ''));
      cells.push(
        cell('target' + i, d.target_alphabet[i], x, y + 72, i === d.target ? 'target' : '', {
          reveal: step.kind === 'mapping',
        }),
      );
    }
  });
  if (d.source >= 0) {
    const x = 34 + (d.source % 13) * 57,
      y = 60 + Math.floor(d.source / 13) * 165;
    movers.push({ text: d.input, from: point(x, y), to: point(x, y + 72) });
  }
  return { width: 800, height: 355, cells, movers, labels };
}

export function playfairScene(step) {
  if (!['square', 'pair'].includes(step.kind)) return textScene(step);
  const d = step.data,
    cells = [],
    movers = [],
    labels = [],
    outlines = [];
  const at = (index) => point(90 + (index % 5) * 62, 72 + Math.floor(index / 5) * 62);
  labels.push({ x: 60, y: 29, text: 'MATRIKS KUNCI  /  I = J' });
  for (let i = 0; i < 25; i++) {
    const pos = at(i);
    cells.push(
      cell(
        'square' + i,
        d.square[i] ?? '',
        pos.x,
        pos.y,
        d.sources?.includes(i) ? 'source' : d.targets?.includes(i) ? 'target' : '',
        { reveal: step.kind === 'square' && i === d.cell, width: 50 },
      ),
    );
  }
  if (step.kind === 'square') {
    movers.push({ text: d.input, from: point(600, 164), to: at(d.cell) });
    labels.push({ x: 600, y: 110, text: 'HURUF BERIKUTNYA', anchor: 'middle' });
  } else {
    labels.push({ x: 588, y: 70, text: 'PASANGAN INPUT', anchor: 'middle' });
    labels.push({ x: 588, y: 221, text: 'PASANGAN HASIL', anchor: 'middle' });
    const rules = { row: 'Satu baris', column: 'Satu kolom', rectangle: 'Persegi panjang' };
    labels.push({ x: 588, y: 180, text: rules[d.rule], anchor: 'middle' });
    [...d.input].forEach((char, i) => {
      cells.push(cell('input' + i, char, 556 + i * 64, 112, 'source'));
      cells.push(cell('output' + i, d.output[i], 556 + i * 64, 268, 'target', { reveal: true }));
      const from = at(d.sources[i]),
        to = at(d.targets[i]);
      let via = [];
      if (d.rule === 'row' && Math.abs(from.x - to.x) > 62) {
        const edge = d.direction === 1 ? 395 : 32;
        via = [point(edge, from.y), point(edge, from.y - 30), point(to.x, to.y - 30)];
      } else if (d.rule === 'column' && Math.abs(from.y - to.y) > 62) {
        const edge = d.direction === 1 ? 370 : 40;
        via = [point(from.x, edge), point(from.x + 30, edge), point(to.x + 30, to.y)];
      }
      movers.push({ text: char, from, to, via });
    });
    if (d.rule === 'rectangle') {
      const first = at(d.sources[0]),
        second = at(d.sources[1]);
      outlines.push({
        x: Math.min(first.x, second.x) - 26,
        y: Math.min(first.y, second.y) - 26,
        width: Math.abs(first.x - second.x) + 52,
        height: Math.abs(first.y - second.y) + 52,
      });
    }
  }
  return { width: 800, height: 392, cells, movers, labels, outlines };
}

export function transpositionScene(step) {
  if (!['order', 'fill', 'read'].includes(step.kind)) return textScene(step);
  const d = step.data,
    cells = [],
    movers = [],
    labels = [];
  // Horizontally scroll large keys instead of shrinking glyphs on the projector.
  const width = Math.max(800, d.cols * 56 + 280);
  const height = Math.max(345, d.rows * 55 + 120);
  if (step.kind === 'order') {
    labels.push(
      { x: 20, y: 30, text: 'POSISI KOLOM ASLI' },
      { x: 20, y: 183, text: 'URUTAN BACA BERDASARKAN KUNCI' },
    );
    [...d.key].forEach((char, col) => {
      const rank = d.order.indexOf(col);
      const from = point(40 + col * 56, 76),
        to = point(40 + rank * 56, 233);
      cells.push(cell('original' + col, char, from.x, from.y, '', { label: String(col + 1) }));
      cells.push(
        cell('sorted' + col, char, to.x, to.y, 'target', {
          label: 'kol. ' + (col + 1),
          reveal: true,
        }),
      );
      movers.push({ text: char, from, to });
    });
    return { width, height: 325, cells, movers, labels };
  }
  const at = (index) => point(40 + (index % d.cols) * 56, 112 + Math.floor(index / d.cols) * 55);
  labels.push({ x: 20, y: 24, text: 'KUNCI / URUTAN BACA KOLOM' });
  [...d.key].forEach((char, i) => {
    cells.push(
      cell('key' + i, char, 40 + i * 56, 57, '', { label: String(d.order.indexOf(i) + 1) }),
    );
  });
  d.grid.forEach((char, i) => {
    const p = at(i);
    cells.push(
      cell('grid' + i, char, p.x, p.y, i === d.cell ? 'source' : '', {
        reveal: step.kind === 'fill' && i === d.cell,
      }),
    );
  });
  if (d.cell !== undefined) {
    const slot = point(width - 100, 155);
    labels.push({
      x: slot.x,
      y: 104,
      text: step.kind === 'fill' ? 'INPUT' : 'OUTPUT',
      anchor: 'middle',
    });
    cells.push(cell('slot', d.input, slot.x, slot.y, 'target', { reveal: step.kind === 'read' }));
    movers.push({
      text: d.input,
      from: step.kind === 'fill' ? slot : at(d.cell),
      to: step.kind === 'fill' ? at(d.cell) : slot,
    });
  } else
    labels.push({ x: width - 105, y: 155, text: 'Baca urutan 1 → ' + d.cols, anchor: 'middle' });
  return { width, height, cells, movers, labels };
}

/** Interpolate a path by distance so arbitrary seeking is deterministic. */
export function along(mover, progress) {
  const points = [mover.from, ...(mover.via ?? []), mover.to];
  const lengths = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  let distance = Math.max(0, Math.min(1, progress)) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const fraction = lengths[i] ? distance / lengths[i] : 1;
      return point(
        points[i].x + (points[i + 1].x - points[i].x) * fraction,
        points[i].y + (points[i + 1].y - points[i].y) * fraction,
      );
    }
    distance -= lengths[i];
  }
  return mover.to;
}
