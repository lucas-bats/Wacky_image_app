
'use server';

import { generateImage } from '@/ai/flows/generate-image';
import { generateRandomPrompt } from '@/ai/flows/generate-chaos-prompt';

export async function generateImageAction(keywords: string[]): Promise<{ imageUrl: string | null; error: string | null; prompt: string }> {
  const prompt = keywords.join(' ');
  try {
    if (!keywords || keywords.length === 0) {
      return { imageUrl: null, error: 'Please select at least one keyword.', prompt };
    }
    const result = await generateImage({ keywords });
    return { imageUrl: result.image, error: null, prompt };
  } catch (e) {
    console.error(e);
    return { imageUrl: null, error: 'Failed to generate image. The AI might be having a moment. Please try again.', prompt };
  }
}

export async function generateChaosImageAction(): Promise<{ imageUrl: string | null; prompt: string | null; error: string | null }> {
  try {
    const { prompt } = await generateRandomPrompt();
    if (!prompt) {
        return { imageUrl: null, prompt: null, error: 'Failed to generate a chaos prompt.' };
    }
    const result = await generateImage({ keywords: [prompt] });
    return { imageUrl: result.image, prompt, error: null };
  } catch (e) {
    console.error(e);
    return { imageUrl: null, prompt: null, error: 'Failed to generate image from chaos prompt. The AI is extra chaotic today. Please try again.' };
  }
}
