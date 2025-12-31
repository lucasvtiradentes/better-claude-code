<script lang="ts">
  import { Check, Copy } from 'lucide-svelte';
  import { Highlight } from 'svelte-highlight';
  import {
    bash,
    cpp,
    csharp,
    go,
    java,
    javascript,
    json,
    kotlin,
    php,
    python,
    ruby,
    rust,
    swift,
    typescript
  } from 'svelte-highlight/languages';
  import { atomOneDark, atomOneLight } from 'svelte-highlight/styles';
  import { theme } from '../utils/theme';

  interface Props {
    code: string;
    language?: string;
  }

  let { code, language = 'typescript' }: Props = $props();

  let copied = $state(false);

  const languageMap: Record<string, unknown> = {
    typescript,
    javascript,
    python,
    bash,
    json,
    go,
    rust,
    java,
    cpp,
    csharp,
    ruby,
    php,
    swift,
    kotlin,
    ts: typescript,
    js: javascript,
    py: python,
    sh: bash
  };

  function getLanguage(lang: string) {
    return languageMap[lang.toLowerCase()] || typescript;
  }

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }
</script>

<svelte:head>
  {#if $theme === 'dark'}
    {@html atomOneDark}
  {:else}
    {@html atomOneLight}
  {/if}
</svelte:head>

<div class="relative group rounded-md overflow-hidden my-2">
  <button
    type="button"
    onclick={copyCode}
    class="absolute top-2 right-2 p-1.5 rounded bg-zinc-700/80 text-zinc-300
           opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-600"
  >
    {#if copied}
      <Check class="h-4 w-4 text-green-400" />
    {:else}
      <Copy class="h-4 w-4" />
    {/if}
  </button>

  <Highlight language={getLanguage(language)} {code} />
</div>
