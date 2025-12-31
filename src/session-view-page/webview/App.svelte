<script lang="ts">
  import { onMount } from 'svelte';
  import SessionContent from './components/SessionContent.svelte';
  import SessionHeader from './components/SessionHeader.svelte';
  import { filtersStore, sessionStore } from './stores';

  let loading = $state(true);

  onMount(() => {
    sessionStore.init();
    filtersStore.init();
  });

  $effect(() => {
    if ($sessionStore) {
      loading = false;
      if ($sessionStore.filters) {
        filtersStore.setFromSession($sessionStore.filters);
      }
    }
  });
</script>

<div class="dark bg-background text-foreground h-screen flex flex-col">
  {#if loading}
    <div class="flex-1 flex items-center justify-center">
      <p class="text-muted-foreground">Loading session...</p>
    </div>
  {:else}
    <SessionHeader />
    <SessionContent />
  {/if}
</div>
