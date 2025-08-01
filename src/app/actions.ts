
'use server';

import { generateImage } from '@/ai/flows/generate-image';
import { ChaosPromptOutput, generateRandomPrompt } from '@/ai/flows/generate-chaos-prompt';
import { firestore } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const MAX_GALLERY_IMAGES = 12;

export interface GalleryImage {
  id: string;
  imageUrl: string;
  prompt: string;
  createdAt: string; 
}

export async function generateImageAction(keywords: string[], prompt: string): Promise<{ imageUrl: string | null; error: string | null; prompt: string }> {
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

export async function saveImageToGalleryAction(userId: string, image: Omit<GalleryImage, 'id' | 'createdAt'>): Promise<{ success: boolean; error: string | null; imageId?: string }> {
    if (!userId) {
        return { success: false, error: 'User not authenticated.' };
    }
    
    const galleryRef = doc(firestore, 'galleries', userId);
    
    try {
        const docSnap = await getDoc(galleryRef);
        const newImage: GalleryImage = {
            ...image,
            id: new Date().toISOString() + Math.random(), 
            createdAt: new Date().toISOString(),
        };

        if (docSnap.exists()) {
            const galleryData = docSnap.data();
            let images = galleryData.images || [];
            
            // Add new image to the start
            images.unshift(newImage); 
            
            // Enforce max gallery size
            if (images.length > MAX_GALLERY_IMAGES) {
                images = images.slice(0, MAX_GALLERY_IMAGES);
            }
            
            await updateDoc(galleryRef, { images });

        } else {
            // If the document doesn't exist, create it
            await setDoc(galleryRef, { images: [newImage] });
        }
        return { success: true, error: null, imageId: newImage.id };
    } catch (e) {
        console.error("Error saving to Firestore:", e);
        return { success: false, error: 'Failed to save image to gallery.' };
    }
}


export async function getGalleryAction(userId: string): Promise<{ images: GalleryImage[]; error: string | null }> {
    if (!userId) {
        return { images: [], error: 'User not authenticated.' };
    }
    const galleryRef = doc(firestore, 'galleries', userId);
    try {
        const docSnap = await getDoc(galleryRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Ensure images are sorted by creation date, descending
            const images = (data.images || []).sort((a: GalleryImage, b: GalleryImage) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return { images, error: null };
        } else {
            return { images: [], error: null };
        }
    } catch (e) {
        console.error("Error fetching from Firestore:", e);
        return { images: [], error: 'Failed to fetch gallery.' };
    }
}

export async function deleteImageAction(userId: string, imageId: string): Promise<{ success: boolean; error: string | null }> {
    if (!userId) {
        return { success: false, error: 'User not authenticated.' };
    }
    const galleryRef = doc(firestore, 'galleries', userId);
    try {
        const docSnap = await getDoc(galleryRef);
        if (docSnap.exists()) {
            const galleryData = docSnap.data();
            const updatedImages = galleryData.images.filter((img: GalleryImage) => img.id !== imageId);
            
            await updateDoc(galleryRef, {
                images: updatedImages
            });
        }
        return { success: true, error: null };
    } catch (e) {
        console.error("Error deleting from Firestore:", e);
        return { success: false, error: 'Failed to delete image.' };
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
