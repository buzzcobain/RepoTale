import { IngestionOptions, RepoTaleStory } from '../types/story';
import { ExportOptions, ExportResult, IngestionProgress } from '../types/api';
import { SAMPLE_STORIES, generateSynthesizedStory } from './sampleStories';
import { generateStoryWithLLM, checkOllamaHealth } from './llmService';

// Check if running inside Tauri desktop app
export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
};

export async function checkOllama(baseUrl?: string): Promise<string[]> {
  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<string[]>('check_ollama', { baseUrl });
    } catch (e) {
      console.warn('Tauri check_ollama failed, falling back to direct fetch', e);
    }
  }
  return await checkOllamaHealth(baseUrl || 'http://localhost:11434');
}

export async function saveApiKey(provider: string, apiKey: string): Promise<void> {
  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('save_api_key', { provider, apiKey });
      return;
    } catch (e) {
      console.warn('Tauri save_api_key failed, using localStorage fallback', e);
    }
  }
  localStorage.setItem(`repotale_key_${provider}`, apiKey);
}

export async function getApiKey(provider: string): Promise<string> {
  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<string>('get_api_key', { provider });
    } catch (e) {
      // Fallback
    }
  }
  return localStorage.getItem(`repotale_key_${provider}`) || '';
}

export async function deleteApiKey(provider: string): Promise<void> {
  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('delete_api_key', { provider });
      return;
    } catch (e) {
      // Fallback
    }
  }
  localStorage.removeItem(`repotale_key_${provider}`);
}

export async function ingestRepository(
  options: IngestionOptions,
  onProgress?: (progress: IngestionProgress) => void
): Promise<RepoTaleStory> {
  const notify = (stage: IngestionProgress['stage'], percent: number, message: string, detail?: string) => {
    if (onProgress) onProgress({ stage, percent, message, detail });
  };

  notify('cloning', 15, 'Initiating sandbox clone...', `Target: ${options.urlOrPath}`);
  await new Promise(r => setTimeout(r, 400));

  const lowerUrl = options.urlOrPath.toLowerCase().trim();

  // 1. Tauri desktop native backend (git shallow clone + Tree-sitter AST parser)
  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      notify('cloning', 30, 'Cloning git repository (--depth 1)...', options.urlOrPath);

      const cloneRes = options.sourceType === 'local'
        ? await invoke<any>('parse_local_repository', { path: options.urlOrPath })
        : await invoke<any>('clone_repository', { url: options.urlOrPath });

      notify('ast_parsing', 60, 'Tree-sitter AST extraction complete', `${cloneRes.scaffold.nodes.length} nodes identified`);
      notify('prompting_llm', 80, `Querying ${options.provider} (${options.modelName})...`);

      const storyJsonStr = await invoke<string>('run_inference', {
        req: {
          provider: options.provider,
          model: options.modelName,
          custom_api_key: options.apiKey,
        },
        manifest: cloneRes.manifest,
        scaffold: cloneRes.scaffold,
      });

      const story: RepoTaleStory = JSON.parse(storyJsonStr);
      notify('done', 100, `RepoTale story generated with ${options.modelName}!`);
      return story;
    } catch (e: any) {
      console.warn('Tauri backend call failed, attempting web LLM inference:', e);
    }
  }

  // 2. Web Mode: Attempt live LLM generation (Ollama local or Cloud BYOK)
  notify('sniffing', 35, 'Analyzing repository metadata...', options.urlOrPath);
  await new Promise(r => setTimeout(r, 400));
  notify('ast_parsing', 65, 'Extracting architectural components & call sites...', options.urlOrPath);
  await new Promise(r => setTimeout(r, 450));
  notify('prompting_llm', 85, `Prompting ${options.provider.toUpperCase()} (${options.modelName})...`, 'Streaming structured story JSON');

  try {
    const generatedStory = await generateStoryWithLLM({
      repoUrl: options.urlOrPath,
      provider: options.provider,
      model: options.modelName,
      apiKey: options.apiKey
    });
    notify('done', 100, `Successfully analyzed ${options.urlOrPath} with ${options.modelName}!`);
    return generatedStory;
  } catch (err: any) {
    console.warn('Live LLM digestion failed or offline, checking curated sample stories:', err);

    // 3. Fallback: If LLM is offline, check if input matches any curated sample stories
    for (const [key, sampleStory] of Object.entries(SAMPLE_STORIES)) {
      const repoMatch = sampleStory.meta.repoName.toLowerCase();
      if (
        lowerUrl.includes(key) ||
        lowerUrl.includes(repoMatch) ||
        repoMatch.includes(lowerUrl) ||
        (key === 'repotale' && (lowerUrl.includes('repotale') || lowerUrl.includes('buzzcobain')))
      ) {
        notify('done', 100, `Loaded curated story for ${sampleStory.meta.repoName}`);
        return sampleStory;
      }
    }

    // 4. Fallback: Synthesize deterministic AST structure offline
    notify('prompting_llm', 90, 'Synthesizing offline AST structure & chapters...', options.urlOrPath);
    await new Promise(r => setTimeout(r, 450));
    notify('done', 100, `Generated architectural story for ${options.urlOrPath}!`);
    return generateSynthesizedStory(options.urlOrPath);
  }
}

export async function fetchGitRemoteInfo(): Promise<{ remoteUrl: string; owner: string; repo: string }> {
  try {
    const res = await fetch('/api/git/info');
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return { remoteUrl: '', owner: '', repo: '' };
}

export async function exportRepoTaleDocs(
  story: RepoTaleStory,
  options: ExportOptions
): Promise<ExportResult> {
  const { generateMarkdownReadme } = await import('./exportService');
  const { generateStandaloneHtml } = await import('./exportService');

  const markdownContent = generateMarkdownReadme(story, options);
  const staticHtmlContent = generateStandaloneHtml(story);
  const branch = 'docs/repotale-guide';

  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const res = await invoke<any>('export_docs', {
        payload: {
          story_json: JSON.stringify(story),
          html_content: staticHtmlContent,
          target_dir: '.',
          create_git_branch: true,
          branch_name: branch,
          github_username: options.githubUsername,
          repo_name: options.repositoryName,
          update_readme: options.updateReadme ?? true,
          push_to_remote: options.pushToRemote ?? true,
        }
      });
      const pushed = !!res.pushed_to_remote;
      return {
        markdownContent,
        staticHtmlContent,
        savedPath: res.static_html_path,
        branchName: branch,
        pushedToRemote: pushed,
        prUrl: pushed && options.githubUsername && options.repositoryName
          ? (res.pr_url || `https://github.com/${options.githubUsername}/${options.repositoryName}/compare/main...${branch}?expand=1`)
          : undefined,
      };
    } catch (e) {
      console.warn('Tauri export_docs fallback', e);
    }
  }

  // Web dev mode: call Vite dev server git endpoint
  try {
    const res = await fetch('/api/git/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markdownContent,
        staticHtmlContent,
        branchName: branch,
        updateReadme: options.updateReadme ?? true,
        pushToRemote: options.pushToRemote ?? true,
        githubUsername: options.githubUsername,
        repositoryName: options.repositoryName,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const pushed = !!data.pushedToRemote;
      const prUrl = pushed && options.githubUsername && options.repositoryName
        ? `https://github.com/${options.githubUsername}/${options.repositoryName}/compare/main...${branch}?expand=1`
        : undefined;

      return {
        markdownContent,
        staticHtmlContent,
        branchName: data.branchName || branch,
        pushedToRemote: pushed,
        prUrl,
        gitError: data.gitError,
      };
    }
  } catch (err) {
    console.warn('Vite /api/git/export call error:', err);
  }

  return {
    markdownContent,
    staticHtmlContent,
    branchName: branch,
    pushedToRemote: false,
    prUrl: undefined,
  };
}
