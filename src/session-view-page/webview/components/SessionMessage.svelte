<script lang="ts">
  import { Bot } from 'lucide-svelte';
  import type { SessionImage, SessionMessageType } from '../types';
  import { type CodeBlock as CodeBlockType, formatMessageContent, FormatterSource } from '../utils/message-formatter';
  import CodeBlock from './CodeBlock.svelte';

  interface Props {
    messages: SessionMessageType[];
    onImageClick?: (imageIndex: number) => void;
    availableImages?: number[];
    images?: SessionImage[];
  }

  let { messages, onImageClick, availableImages = [], images = [] }: Props = $props();

  let isUser = $derived(messages.length > 0 && messages[0].type === 'user');

  let formattedData = $derived.by(() => {
    const allImageRefs: Array<{ index: number; exists: boolean; data?: string }> = [];
    const allCodeBlocks: CodeBlockType[] = [];
    const htmlParts: string[] = [];

    for (const message of messages) {
      if (typeof message.content === 'string') {
        const { html, imageRefs, codeBlocks } = formatMessageContent(message.content, {
          source: FormatterSource.SESSION_MESSAGE,
          availableImages,
          images,
          messageId: message.id
        });
        htmlParts.push(html);
        allImageRefs.push(...imageRefs);
        allCodeBlocks.push(...codeBlocks);
      }
    }

    return { htmlParts, allImageRefs, allCodeBlocks };
  });

  function handleImageClick(imageRef: { index: number; data?: string }) {
    if (!onImageClick || !imageRef.data) return;
    const messageId = messages[0]?.id;
    const globalImageIndex = images.findIndex((img) => img.messageId === messageId && img.index === imageRef.index);
    onImageClick(globalImageIndex >= 0 ? globalImageIndex : 0);
  }
</script>

<div class="mb-3 flex gap-2 items-start {isUser ? 'justify-end' : ''}">
  {#if !isUser}
    <div
      class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground mt-2"
    >
      <Bot class="h-4 w-4" />
    </div>
  {/if}

  <div class="p-2 px-3 rounded-md wrap-break-word max-w-[85%] flex flex-col gap-2 {isUser ? 'bg-secondary' : 'bg-card'}">
    {#each messages as message, idx}
      {#if typeof message.content === 'string'}
        {@const html = formattedData.htmlParts[idx]}
        {@const parts = html.split(/(<div data-code-block="[^"]+"><\/div>)/)}

        <div>
          {#if idx > 0}
            <div class="flex justify-center my-2">
              <div class="w-1/2 border-t border-border"></div>
            </div>
          {/if}

          <div class="text-left w-full">
            {#each parts as part}
              {@const codeBlockMatch = part.match(/data-code-block="([^"]+)"/)}
              {#if codeBlockMatch}
                {@const codeBlock = formattedData.allCodeBlocks.find((block) => block.id === codeBlockMatch[1])}
                {#if codeBlock}
                  <CodeBlock code={codeBlock.code} language={codeBlock.language} />
                {/if}
              {:else}
                {@const cleanedPart = part.replace(/^(<br\s*\/?>)+|(<br\s*\/?>)+$/g, '')}
                {#if cleanedPart}
                  {@html cleanedPart}
                {/if}
              {/if}
            {/each}
          </div>
        </div>
      {/if}
    {/each}

    {#if isUser && formattedData.allImageRefs.filter((img) => img.data).length > 0}
      <div
        class="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
        {#each formattedData.allImageRefs.filter((img) => img.data) as imageRef}
          <div class="shrink-0">
            <button
              type="button"
              onclick={() => handleImageClick(imageRef)}
              class="relative block w-32 h-32 rounded-lg border border-border overflow-hidden hover:opacity-90 transition-opacity cursor-pointer"
            >
              <img
                src="data:image/png;base64,{imageRef.data}"
                alt="#{imageRef.index}"
                class="w-full h-full object-cover"
              />
              <div
                class="absolute bottom-0 left-0 bg-black/70 text-white text-xs font-semibold px-1.5 py-0.5 rounded-tr-md"
              >
                #{imageRef.index}
              </div>
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  {#if isUser}
    <img
      src="https://github.com/lucasvtiradentes.png"
      alt="User"
      class="h-6 w-6 shrink-0 rounded-full mt-2"
    />
  {/if}
</div>
