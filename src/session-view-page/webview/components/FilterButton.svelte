<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    isActive: boolean;
    onclick: () => void;
    children: Snippet;
  }

  let { isActive, onclick, children }: Props = $props();
</script>

<button
  type="button"
  {onclick}
  class="p-1.5 rounded transition-all duration-200 {isActive
    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50'}"
>
  {@render children()}
</button>
