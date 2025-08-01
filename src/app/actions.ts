
'use server';

import { generateImage } from '@/ai/flows/generate-image';
import { ChaosPromptOutput, generateRandomPrompt } from '@/ai/flows/generate-chaos-prompt';

export interface GalleryImage {
  id: string;
  imageUrl: string;
  prompt: string;
  createdAt: string;
}


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

export async function generateChaosPromptAction(): Promise<{ result: ChaosPromptOutput | null; error: string | null }> {
  try {
    const result = await generateRandomPrompt();
    if (!result) {
        return { result: null, error: 'Failed to generate a chaos prompt.' };
    }
    return { result, error: null };
  } catch (e) {
    console.error(e);
    return { result: null, error: 'Failed to generate chaos prompt. The AI is extra chaotic today. Please try again.' };
  }
}
