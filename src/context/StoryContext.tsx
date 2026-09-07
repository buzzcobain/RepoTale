import React, { createContext, useContext, useState } from 'react';
import { RepoTaleStory, IngestionOptions } from '../types/story';
import { IngestionProgress, QAMessage } from '../types/api';
import { SAMPLE_STORIES } from '../services/sampleStories';
import { ingestRepository } from '../services/tauriBridge';
import { askCodebaseQuestion } from '../services/llmService';
import { useSettings } from './SettingsContext';

interface StoryContextType {
  story: RepoTaleStory;
  activeChapterIndex: number;
  activeNodes: string[];
  selectedNodeId: string | null;
  isSidecarOpen: boolean;
  messages: QAMessage[];
  isIngesting: boolean;
  ingestionProgress: IngestionProgress;
  isAskingQuestion: boolean;
  setActiveChapterIndex: (index: number) => void;
  selectNode: (nodeId: string | null) => void;
  setIsSidecarOpen: (open: boolean) => void;
  loadStory: (story: RepoTaleStory) => void;
  ingestRepo: (options: IngestionOptions) => Promise<void>;
  askQuestion: (questionText: string) => Promise<void>;
  clearChat: () => void;
}

const StoryContext = createContext<StoryContextType | null>(null);

export const StoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const [story, setStory] = useState<RepoTaleStory>(SAMPLE_STORIES['fastapi']);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSidecarOpen, setIsSidecarOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<QAMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: `👋 Welcome to RepoTale! I am your architectural copilot for **${story.meta.repoName}**.\n\nYou can ask me about call graphs, dependency flows, AST symbols, or specific implementation details in any chapter.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestionProgress, setIngestionProgress] = useState<IngestionProgress>({
    stage: 'idle',
    percent: 0,
    message: 'Ready to ingest repository'
  });
  const [isAskingQuestion, setIsAskingQuestion] = useState<boolean>(false);

  // Active nodes based on current chapter
  const currentChapter = story.chapters[activeChapterIndex] || story.chapters[0];
  const activeNodes = currentChapter?.activeNodes || [];

  const loadStory = (newStory: RepoTaleStory) => {
    setStory(newStory);
    setActiveChapterIndex(0);
    setSelectedNodeId(null);
    setMessages([
      {
        id: 'new-story',
        sender: 'assistant',
        content: `Loaded **${newStory.meta.repoName}** story with ${newStory.chapters.length} chapters and ${newStory.callGraph.nodes.length} AST symbols. Ready to explore!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  const selectNode = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (!nodeId) return;

    // Find the chapter that features this node in activeNodes or matches its file/symbol
    const symbolLabel = nodeId.split(':').pop() || '';
    const targetChapterIdx = story.chapters.findIndex((chap) => {
      if (chap.activeNodes.includes(nodeId)) return true;
      return chap.codeSnippets.some(
        (s) => nodeId.includes(s.filePath) || (symbolLabel && s.code.includes(symbolLabel))
      );
    });

    if (targetChapterIdx !== -1) {
      setActiveChapterIndex(targetChapterIdx);
      setTimeout(() => {
        const card = document.getElementById(`chapter-card-${targetChapterIdx}`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Highlight card temporarily
          card.classList.add('ring-4', 'ring-indigo-400/80', 'border-indigo-400');
          setTimeout(() => {
            card.classList.remove('ring-4', 'ring-indigo-400/80', 'border-indigo-400');
          }, 2500);
        }
      }, 50);
    }
  };

  const ingestRepo = async (options: IngestionOptions) => {
    setIsIngesting(true);
    setIngestionProgress({ stage: 'cloning', percent: 10, message: 'Starting repository ingestion...' });
    try {
      const generated = await ingestRepository(options, (progress) => {
        setIngestionProgress(progress);
      });
      loadStory(generated);
    } catch (err: any) {
      setIngestionProgress({
        stage: 'error',
        percent: 0,
        message: 'Ingestion failed',
        detail: err?.message || 'Unknown error during cloning/AST analysis'
      });
      throw err;
    } finally {
      setIsIngesting(false);
    }
  };

  const askQuestion = async (questionText: string) => {
    if (!questionText.trim()) return;

    const userMsg: QAMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsAskingQuestion(true);

    try {
      const apiKey = settings.apiKeys[settings.defaultProvider as keyof typeof settings.apiKeys];
      const res = await askCodebaseQuestion({
        question: questionText,
        story,
        provider: settings.defaultProvider,
        model: settings.selectedModel,
        apiKey,
        currentChapterId: currentChapter?.id
      });

      const assistantMsg: QAMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        referencedSymbols: res.referencedSymbols,
        referencedFiles: res.referencedFiles,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      const errorMsg: QAMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: `⚠️ Failed to get answer: ${e?.message || 'Inference error'}. Please check your API key or Ollama connection in Settings.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAskingQuestion(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <StoryContext.Provider
      value={{
        story,
        activeChapterIndex,
        activeNodes,
        selectedNodeId,
        isSidecarOpen,
        messages,
        isIngesting,
        ingestionProgress,
        isAskingQuestion,
        setActiveChapterIndex,
        selectNode,
        setIsSidecarOpen,
        loadStory,
        ingestRepo,
        askQuestion,
        clearChat,
      }}
    >
      {children}
    </StoryContext.Provider>
  );
};

export const useStory = () => {
  const ctx = useContext(StoryContext);
  if (!ctx) throw new Error('useStory must be used within a StoryProvider');
  return ctx;
};
