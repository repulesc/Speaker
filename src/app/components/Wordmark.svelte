<script lang="ts">
  import { APP_NAME } from '../config';

  /**
   * The NODO wordmark (V9 identity, docs/ROADMAP_V9.md §3): drawn, not typed, on a 4-unit grid with
   * one stroke width. Bars, two full circles and a half circle; the last O carries a dot, the node:
   * the point in the room the app is about. Takes its colour from `--brand`.
   */
  let { height = 18 }: { height?: number } = $props();
</script>

<svg
  class="wordmark"
  viewBox="-1 -1 87 22"
  {height}
  width={(height * 87) / 22}
  role="img"
  aria-label={APP_NAME}
>
  <!-- N -->
  <rect x="0" y="0" width="4" height="20" />
  <rect x="14" y="0" width="4" height="20" />
  <polygon points="0,0 4.9,0 18,20 13.1,20" />
  <!-- O -->
  <path fill-rule="evenodd" d="M32,-0.4a10.4,10.4 0 1 0 0.001,0Z M32,4a6,6 0 1 0 0.001,0Z" />
  <!-- D -->
  <path
    fill-rule="evenodd"
    d="M46,0 H52 A10,10 0 0 1 52,20 H46 Z M50,4 V16 H52 A6,6 0 0 0 52,4 Z"
  />
  <!-- O with the node -->
  <path fill-rule="evenodd" d="M75,-0.4a10.4,10.4 0 1 0 0.001,0Z M75,4a6,6 0 1 0 0.001,0Z" />
  <circle cx="75" cy="10" r="2.2" />
</svg>

<style>
  .wordmark {
    display: block;
    flex: none;
    fill: var(--brand);
  }
</style>
