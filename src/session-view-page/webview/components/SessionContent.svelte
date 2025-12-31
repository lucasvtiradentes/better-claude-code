<script lang="ts">
  import { groupedMessages, sessionStore } from '../stores';
  import { vscode } from '../utils/vscode';
  import SessionMessage from './SessionMessage.svelte';

  let images = $derived($sessionStore?.conversation?.images || []);

  function handleImageClick(imageIndex: number) {
    const image = images[imageIndex];
    if (image) {
      vscode.postMessage({
        type: 'openImage',
        imageData: image.data,
        imageIndex: image.index
      });
    }
  }
</script>

<div class="flex-1 overflow-y-auto min-h-0">
  <div class="max-w-4xl mx-auto p-4">
    <div class="space-y-2">
      {#each $groupedMessages as messages, idx (idx)}
        <SessionMessage
          {messages}
          onImageClick={handleImageClick}
          {images}
          availableImages={images.map((img) => img.index)}
        />
      {/each}

      {#if $groupedMessages.length === 0}
        <div class="text-center text-muted-foreground py-8">No messages to display</div>
      {/if}
    </div>
  </div>
</div>
