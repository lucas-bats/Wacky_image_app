
'use server';

import { generateImage } from '@/ai/flows/generate-image';
import { ChaosPromptOutput, generateRandomPrompt } from '@/ai/flows/generate-chaos-prompt';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';

export interface GalleryImage {
  id: string;
  imageUrl: string;
  prompt: string;
  createdAt: Date;
}


export async function generateImageAction(keywords: string[]): Promise<{ imageUrl: string | null; error: string | null; prompt: string }> {
  const prompt = keywords.join(' ');
  try {
    if (!keywords || keywords.length === 0) {
      return { imageUrl: null, error: 'Please select at least one keyword.', prompt };
    }
    const result = await generateImage({ keywords });
    if(result.image){
      await saveImageToGallery(result.image, prompt);
    }
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

async function saveImageToGallery(imageUrl: string, prompt: string): Promise<void> {
  try {
    await addDoc(collection(firestore, "gallery"), {
      imageUrl,
      prompt,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving image to gallery: ", error);
    // We don't throw an error here so the user still sees their image
  }
}

export async function getGalleryImages(): Promise<{ images: GalleryImage[] | null, error: string | null }> {
    try {
        const q = query(collection(firestore, "gallery"), orderBy("createdAt", "desc"), limit(20));
        const querySnapshot = await getDocs(q);
        const images = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                imageUrl: data.imageUrl,
                prompt: data.prompt,
                createdAt: data.createdAt.toDate(),
            };
        });
        return { images, error: null };
    } catch (error) {
        console.error("Error getting gallery images: ", error);
        if ((error as any).code === 'failed-precondition') {
          return { images: null, error: "Firestore is not enabled. Please enable it in your Firebase console and set up security rules." };
        }
        return { images: null, error: "Could not fetch gallery images. Please make sure Firestore is enabled and security rules are set up correctly." };
    }
}
