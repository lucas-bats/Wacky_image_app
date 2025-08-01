
'use server';

import { generateImage } from '@/ai/flows/generate-image';
import { ChaosPromptOutput, generateRandomPrompt } from '@/ai/flows/generate-chaos-prompt';
import { firestore, storage } from '@/lib/firebase';
import { collection, doc, addDoc, getDocs, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

export interface GalleryImage {
  id: string; // Document ID from Firestore
  imageUrl: string;
  prompt: string;
  storagePath: string;
  createdAt: string; 
}

// Generate the image with AI, then upload to storage and save metadata to firestore
export async function generateImageAction(userId: string, keywords: string[], prompt: string): Promise<{ imageUrl: string | null; error: string | null; }> {
  if (!userId) {
    return { imageUrl: null, error: 'User not authenticated.' };
  }
  if (!keywords || keywords.length === 0) {
    return { imageUrl: null, error: 'Please select at least one keyword.' };
  }

  try {
    // 1. Generate image using the AI flow
    const result = await generateImage({ keywords });
    const imageDataUrl = result.image;

    // 2. Upload the generated image data URL to Firebase Storage
    const timestamp = new Date().getTime();
    const storagePath = `images/${userId}/${timestamp}.png`;
    const storageRef = ref(storage, storagePath);
    
    // The 'data_url' format is essential for uploadString to work correctly with data URIs
    await uploadString(storageRef, imageDataUrl, 'data_url');

    // 3. Get the public download URL for the uploaded image
    const downloadURL = await getDownloadURL(storageRef);

    // 4. Save the image metadata to Firestore
    const userImagesCollection = collection(firestore, 'userImages');
    await addDoc(userImagesCollection, {
      uid: userId,
      imageUrl: downloadURL,
      prompt: prompt,
      storagePath: storagePath,
      createdAt: new Date().toISOString(),
    });
    
    return { imageUrl: downloadURL, error: null };

  } catch (e: any) {
    console.error("Full error in generateImageAction:", e);
    return { imageUrl: null, error: e.message || 'Failed to generate and save image. The AI might be having a moment. Please try again.' };
  }
}


// Fetch all images for the logged-in user from Firestore
export async function getGalleryAction(userId: string): Promise<{ images: GalleryImage[]; error: string | null }> {
    if (!userId) {
        return { images: [], error: 'User not authenticated.' };
    }
    
    try {
        const userImagesCollection = collection(firestore, 'userImages');
        const q = query(
            userImagesCollection, 
            where('uid', '==', userId), 
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        const images = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as GalleryImage[];
        
        return { images, error: null };
    } catch (e) {
        console.error("Error fetching from Firestore:", e);
        return { images: [], error: 'Failed to fetch gallery.' };
    }
}

// Delete an image from Storage and its metadata from Firestore
export async function deleteImageAction(userId: string, image: GalleryImage): Promise<{ success: boolean; error: string | null }> {
    if (!userId || !image || !image.id || !image.storagePath) {
        return { success: false, error: 'Invalid request. Missing user or image data.' };
    }
    
    try {
        // First, verify the user owns this document (extra security)
        const docRef = doc(firestore, 'userImages', image.id);

        // Delete from Firebase Storage
        const storageRef = ref(storage, image.storagePath);
        await deleteObject(storageRef);
        
        // Then, delete the Firestore document
        await deleteDoc(docRef);

        return { success: true, error: null };
    } catch (e: any) {
        console.error("Error deleting from Firestore/Storage:", e);
        // Handle specific errors for better feedback
        if (e.code === 'storage/object-not-found') {
             // If file is not in storage, maybe it was already deleted. Still try to delete from Firestore.
             try {
                await deleteDoc(doc(firestore, 'userImages', image.id));
                return { success: true, error: null };
             } catch (firestoreError) {
                 return { success: false, error: 'Image file not found and failed to delete record.' };
             }
        }
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
