<script lang="ts">
  import { Cpu, User, Wrench } from 'lucide-svelte';
  import { filtersStore } from '../stores';
  import FilterButton from './FilterButton.svelte';

  let showUserMessages = $derived($filtersStore.showUserMessages);
  let showAssistantMessages = $derived($filtersStore.showAssistantMessages);
  let showToolCalls = $derived($filtersStore.showToolCalls);
</script>

<div class="flex gap-1">
  <FilterButton isActive={showUserMessages} onclick={() => filtersStore.toggle('showUserMessages')}>
    <User class="h-4 w-4" strokeWidth={showUserMessages ? 2.5 : 1.5} />
  </FilterButton>

  <FilterButton isActive={showAssistantMessages} onclick={() => filtersStore.toggle('showAssistantMessages')}>
    <Cpu class="h-4 w-4" strokeWidth={showAssistantMessages ? 2.5 : 1.5} />
  </FilterButton>

  <FilterButton isActive={showToolCalls} onclick={() => filtersStore.toggle('showToolCalls')}>
    <Wrench class="h-4 w-4" strokeWidth={showToolCalls ? 2.5 : 1.5} />
  </FilterButton>
</div>
