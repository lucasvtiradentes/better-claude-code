<script lang="ts">
  import { sessionStore } from '../stores';
  import FilterButtons from './FilterButtons.svelte';
  import SessionActionsMenu from './SessionActionsMenu.svelte';
  import SessionBadges from './SessionBadges.svelte';

  let session = $derived($sessionStore?.session);
</script>

{#if session}
  <div class="px-4 py-4 border-b border-border flex items-center justify-between shrink-0">
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-2 text-muted-foreground">
        <SessionBadges />
      </div>
    </div>
    <div class="flex items-center gap-2">
      <FilterButtons />
      <SessionActionsMenu />
    </div>
  </div>
{/if}
