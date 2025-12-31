<script lang="ts">
  import { Archive, Eye, FileCode, FileText, MoreVertical, Trash2 } from 'lucide-svelte';
  import { sessionStore } from '../stores';
  import { vscode } from '../utils/vscode';

  let open = $state(false);
  let menuRef: HTMLDivElement;

  let hasCompacted = $derived($sessionStore?.session?.compacted ?? false);

  function toggle() {
    open = !open;
  }

  function close() {
    open = false;
  }

  function handleAction(action: string) {
    vscode.postMessage({ type: action });
    close();
  }

  function handleClickOutside(event: MouseEvent) {
    if (menuRef && !menuRef.contains(event.target as Node)) {
      close();
    }
  }

  $effect(() => {
    if (open) {
      document.addEventListener('click', handleClickOutside, true);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  });
</script>

<div bind:this={menuRef} class="relative">
  <button
    type="button"
    onclick={toggle}
    class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
    title="Session actions"
  >
    <MoreVertical class="h-[18px] w-[18px]" />
  </button>

  {#if open}
    <div
      class="absolute right-0 top-full mt-1 w-48 rounded-md border border-[#3f3f46] bg-[#1e1e1e] text-[#e4e4e7] shadow-lg z-50"
    >
      <div class="py-1">
        <button
          type="button"
          onclick={() => handleAction('openRawSession')}
          class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[#2a2d2e] cursor-pointer"
        >
          <FileCode class="h-4 w-4" />
          Open raw JSONL
        </button>

        {#if !hasCompacted}
          <button
            type="button"
            onclick={() => handleAction('compactSession')}
            class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[#2a2d2e] cursor-pointer"
          >
            <Archive class="h-4 w-4" />
            Compact session
          </button>
        {/if}

        {#if hasCompacted}
          <button
            type="button"
            onclick={() => handleAction('openParsed')}
            class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[#2a2d2e] cursor-pointer"
          >
            <FileText class="h-4 w-4" />
            Open parsed
          </button>

          <button
            type="button"
            onclick={() => handleAction('openSummary')}
            class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[#2a2d2e] cursor-pointer"
          >
            <Eye class="h-4 w-4" />
            Open summary
          </button>
        {/if}

        <div class="border-t border-[#3f3f46] my-1"></div>

        <button
          type="button"
          onclick={() => handleAction('deleteSession')}
          class="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#f87171] hover:bg-[#2a2d2e] cursor-pointer"
        >
          <Trash2 class="h-4 w-4" />
          Delete session
        </button>
      </div>
    </div>
  {/if}
</div>
