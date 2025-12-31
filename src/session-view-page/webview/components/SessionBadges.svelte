<script lang="ts">
  import { FolderOpen, Image } from 'lucide-svelte';
  import { filesOrFoldersCount, sessionStore } from '../stores';
  import IconWithBadge from './IconWithBadge.svelte';

  let session = $derived($sessionStore?.session);
  let images = $derived($sessionStore?.conversation?.images || []);
</script>

{#if session}
  <div class="flex items-center gap-3">
    {#if images.length > 0}
      <IconWithBadge icon={Image} count={images.length} label="Images" />
    {/if}

    {#if $filesOrFoldersCount > 0}
      <IconWithBadge icon={FolderOpen} count={$filesOrFoldersCount} label="Files/Folders" />
    {/if}

    {#if session.tokenPercentage !== undefined}
      <div class="flex items-center gap-1 text-zinc-400" title="Token usage">
        <span class="text-xs">{session.tokenPercentage}%</span>
      </div>
    {/if}
  </div>
{/if}
