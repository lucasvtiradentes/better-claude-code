<script lang="ts">
  import type { Component } from 'svelte';

  interface Props {
    icon: Component<{ class?: string }>;
    count: number;
    label: string;
  }

  let { icon: Icon, count, label }: Props = $props();
</script>

<div class="flex items-center gap-1 text-zinc-400" title={label}>
  <Icon class="h-4 w-4" />
  <span class="text-xs">{count}</span>
</div>
