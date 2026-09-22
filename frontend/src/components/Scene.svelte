<script>
  import { along, visible } from '../lib/scenes.js';
  let { scene, progress = 0, title } = $props();
  const moveProgress = $derived(Math.max(0, Math.min(1, (progress - 0.3) / 0.5)));
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex (Scrollable diagrams must be keyboard accessible.) -->
<div
  class="scene-scroll"
  tabindex="0"
  role="region"
  aria-label="Area visualisasi yang dapat digulir"
>
  <svg
    class="scene"
    viewBox={`0 0 ${scene.width} ${scene.height}`}
    style={`min-width:${scene.width > 800 ? scene.width : 640}px`}
    role="img"
    aria-label={title}
  >
    <title>{title}</title>
    {#each scene.labels as label, i (i)}
      <text class="svg-label" x={label.x} y={label.y} text-anchor={label.anchor ?? 'start'}
        >{label.text}</text
      >
    {/each}
    {#each scene.outlines ?? [] as outline, i (i)}
      <rect
        class="rule-outline"
        x={outline.x}
        y={outline.y}
        width={outline.width}
        height={outline.height}
        rx="6"
        opacity={progress >= 0.2 ? 1 : 0}
      />
    {/each}
    {#each scene.cells as cell (cell.id)}
      <g transform={`translate(${cell.x},${cell.y})`}>
        <rect
          class:source={cell.role === 'source'}
          class:target={cell.role === 'target'}
          class="letter-cell"
          width={cell.width ?? 42}
          height={cell.width ?? 42}
          x={-(cell.width ?? 42) / 2}
          y={-(cell.width ?? 42) / 2}
          rx="6"
        />
        <text
          class="svg-letter"
          text-anchor="middle"
          dominant-baseline="central"
          opacity={cell.reveal ? Math.max(0, Math.min(1, (progress - 0.78) / 0.15)) : 1}
          >{cell.text}</text
        >
        {#if cell.label !== undefined}<text class="svg-index" text-anchor="middle" y="35"
            >{cell.label}</text
          >{/if}
      </g>
    {/each}
    {#each scene.movers as mover, i (i)}
      {@const position = along(mover, moveProgress)}
      {@const path = [mover.from, ...(mover.via ?? []), mover.to]
        .map((p) => `${p.x},${p.y}`)
        .join(' ')}
      <polyline
        points={path}
        fill="none"
        class="motion-path"
        opacity={progress > 0.18 ? 0.65 : 0}
      />
      <g
        class="moving-letter"
        data-testid="moving-letter"
        transform={`translate(${position.x},${position.y})`}
        opacity={progress >= 0.16 && progress < 0.88 ? 1 : 0}
      >
        <rect x="-23" y="-23" width="46" height="46" rx="7" />
        <text text-anchor="middle" dominant-baseline="central">{visible(mover.text)}</text>
      </g>
      <circle
        cx={mover.to.x}
        cy={mover.to.y}
        r="26"
        class="destination"
        opacity={progress >= 0.88 ? 1 : 0}
      />
    {/each}
  </svg>
</div>
{#if scene.formula}<div class="formula" aria-label="Perhitungan">{scene.formula}</div>{/if}
