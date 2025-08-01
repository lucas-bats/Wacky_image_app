
'use server';

import { generateImage } from '@/ai/flows/generate-image';
import { ChaosPromptOutput, generateRandomPrompt } from '@/ai/flows/generate-chaos-prompt';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, deleteDoc, getDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';


export interface GalleryImage {
  id: string;
  imageUrl: string;
  prompt: string;
  createdAt: string; 
  userId: string;
}

async function saveImageToFirestore(prompt: string, imageUrl: string, userId: string): Promise<string> {
  const docRef = await addDoc(collection(firestore, "gallery"), {
    prompt: prompt,
    imageUrl: imageUrl,
    userId: userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}


export async function generateImageAction(keywords: string[], prompt: string, userId: string | null): Promise<{ imageUrl: string | null; error: string | null; prompt: string, imageId: string | null }> {
  try {
    if (!keywords || keywords.length === 0) {
      return { imageUrl: null, error: 'Please select at least one keyword.', prompt, imageId: null };
    }
    if (!userId) {
        return { imageUrl: null, error: 'User must be logged in to generate images.', prompt, imageId: null };
    }

    const result = await generateImage({ keywords });
    let imageId = null;
    let imageUrl = null;
    if (result.image) {
      imageUrl = result.image;
      imageId = await saveImageToFirestore(prompt, result.image, userId);
    }
    return { imageUrl: imageUrl, error: null, prompt, imageId };
  } catch (e) {
    console.error(e);
    return { imageUrl: null, error: 'Failed to generate image. The AI might be having a moment. Please try again.', prompt, imageId: null };
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

export async function getPublicGalleryAction(): Promise<{ images: GalleryImage[] | null; error: string | null; }> {
    try {
        const q = query(collection(firestore, "gallery"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const images = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                imageUrl: data.imageUrl,
                prompt: data.prompt,
                createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
                userId: data.userId,
            };
        });
        return { images, error: null };
    } catch (e: any) {
        console.error("Could not fetch gallery images.", e);
        return { images: null, error: "Could not fetch gallery images. Please make sure Firestore is enabled and security rules are set up correctly." };
    }
}


export async function deleteImageAction(imageId: string, userId: string | null): Promise<{ success: boolean; error: string | null }> {
    if (!userId) {
        return { success: false, error: 'You must be logged in to delete an image.' };
    }
    try {
        const docRef = doc(firestore, 'gallery', imageId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return { success: false, error: 'Image not found.' };
        }

        if (docSnap.data().userId !== userId) {
            return { success: false, error: 'You are not authorized to delete this image.' };
        }

        await deleteDoc(docRef);
        return { success: true, error: null };
    } catch (e) {
        console.error("Failed to delete image", e);
        return { success: false, error: 'Failed to delete image.' };
    }
}
