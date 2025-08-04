
'use server';

import { generateImage } from '@/ai/flows/generate-image';
import { ChaosPromptOutput, generateRandomPrompt } from '@/ai/flows/generate-chaos-prompt';

// Generate the image with AI
export async function generateImageAction(keywords: string[]): Promise<{ imageUrl: string | null; error: string | null; }> {
  if (!keywords || keywords.length === 0) {
    return { imageUrl: null, error: 'Please select at least one keyword.' };
  }

  try {
    const result = await generateImage({ keywords });
    return { imageUrl: result.image, error: null };

  } catch (e: any) {
    console.error("Full error in generateImageAction:", e);
    return { imageUrl: null, error: e.message || 'Failed to generate and save image. The AI might be having a moment. Please try again.' };
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
