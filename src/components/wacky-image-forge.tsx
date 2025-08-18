

"use client";

// React hooks and library imports.
import { useState, useMemo, useTransition, ReactNode, useRef, useEffect } from 'react';
// Next.js Image component for image optimization.
import Image from 'next/image';
// UI component imports from the ShadCN library.
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast"
import { 
  generateImageAction
} from '@/app/actions';
// Icon imports from the lucide-react library.
import { Sparkles, Wand2, Download, Repeat, Loader2, Languages, Share2, Trash2, ExternalLink, Copy, Heart } from 'lucide-react';
// Utility and translation imports.
import { cn } from '@/lib/utils';
import { translations } from '@/lib/translations';
// Additional UI component imports.
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMediaQuery } from "@/hooks/use-media-query"
import { generateChaosPromptAction } from '@/app/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from './ui/separator';
import { ThemeToggleButton } from './theme-toggle-button';


// Defines types for internationalization state and keyword categories.
type Language = 'en' | 'pt';
type KeywordCategories = (typeof translations)[Language]['keywordCategories'];
type Category = keyof KeywordCategories;
type CategoryName = (typeof translations)[Language]['categoryNames'][Category];

// Defines the interface for gallery images.
interface GalleryImage {
  id: string;
  src: string;
  prompt: string;
  createdAt: string;
}

// Constants for the gallery limit and local storage key.
const GALLERY_LIMIT = 12;
const STORAGE_KEY = 'wackyGallery_local';

/**
 * Main component for the "Wacky Image Forge" application.
 * Allows the user to select keywords to generate images,
 * save them to a local gallery, and switch between languages.
 */
export default function WackyImageForge() {
  // State for the current UI language.
  const [language, setLanguage] = useState<Language>('pt');
  // State to store the keywords selected by the user.
  const [selectedKeywords, setSelectedKeywords] = useState<Map<CategoryName, string>>(new Map());
  // State for the URL of the generated image.
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  // State for the prompt used to generate the image.
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  // Transition hook to handle loading states without blocking the UI.
  const [isPending, startTransition] = useTransition();
  // State to control automatic scrolling to the image area on mobile devices.
  const [shouldScroll, setShouldScroll] = useState(false);
  // Ref for the image area for scrolling.
  const imageAreaRef = useRef<HTMLDivElement>(null);
  // Ref for the donations section.
  const donationSectionRef = useRef<HTMLDivElement>(null);
  // Hook to detect if the view is mobile.
  const isMobile = useMediaQuery("(max-width: 768px)")
  // State for the user's gallery images.
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  // State to ensure the gallery has been loaded from localStorage before saving.
  const [hasLoaded, setHasLoaded] = useState(false);
  // State to control the visibility of the image dialog on desktop.
  const [isImageDialogOpen, setImageDialogOpen] = useState(false);

  // Hook to display notifications (toasts).
  const { toast } = useToast();

  // Quick access to the translations for the selected language.
  const T = translations[language];

  // Effect to load the gallery from localStorage when the component mounts.
  useEffect(() => {
    try {
      const storedGallery = localStorage.getItem(STORAGE_KEY);
      if (storedGallery) {
        setGalleryImages(JSON.parse(storedGallery));
      }
    } catch (error) {
      console.error("Failed to load gallery from localStorage", error);
    }
    setHasLoaded(true);
  }, []);

  // Effect to save the gallery to localStorage whenever it is updated.
  useEffect(() => {
    if (!hasLoaded) return;
    
    const imagesToSave = [...galleryImages];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(imagesToSave));
    } catch (e) {
      // Handles the quota exceeded error in localStorage by removing old images to free up space.
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        let success = false;
        let mutableImagesToSave = [...imagesToSave];
        for (let i = 0; i < imagesToSave.length; i++) {
          mutableImagesToSave.pop(); 
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mutableImagesToSave));
            success = true;
            console.log(`Successfully saved gallery after removing ${i + 1} old image(s).`);
            setGalleryImages(mutableImagesToSave);
            break; 
          } catch (e2) {
            // Continues trying if removing one image is not enough.
          }
        }
        if (!success) {
          console.error("Could not save to localStorage even after removing all images.");
        }
      } else {
        console.error("An unexpected error occurred while saving to localStorage:", e);
      }
    }
  }, [galleryImages, hasLoaded]);
  
  // Effect to scroll the screen to the generated image on mobile devices.
  useEffect(() => {
    if (shouldScroll && imageAreaRef.current && isMobile) {
      imageAreaRef.current.scrollIntoView({ behavior: 'smooth' });
      setShouldScroll(false);
    }
  }, [generatedImage, shouldScroll, isMobile]);


  // Configuration object for keyword categories, including colors and emojis.
  const keywordCategories: { [key: string]: { color: string; textColor: string; keywords: { [key: string]: ReactNode } } } = {
    [T.categoryNames.Animals]: {
      color: 'bg-[#70C46B]',
      textColor: 'text-white',
      keywords: {
        'T-rex': '🦖',
        'Penguin': '🐧',
        'Kitten': '🐱',
        'Puppy': '🐶',
        'Elephant': '🐘',
        'Lion': '🦁',
        'Unicorn': '🦄',
        'Dragon': '🐉',
        'Llama': '🦙',
        'Robot': '🤖',
      }
    },
    [T.categoryNames.Actions]: {
      color: 'bg-[#F5A623]',
      textColor: 'text-white',
      keywords: {
        'eating spaghetti': '🍝',
        'skateboarding': '🛹',
        'dancing': '💃',
        'flying': '🕊️',
        'reading a book': '📖',
        'painting': '🎨',
        'coding': '💻',
        'juggling planets': '🪐',
        'riding a monocycle': '🚲',
        'breathing fire': '🔥',
      }
    },
    [T.categoryNames.Settings]: {
      color: 'bg-[#50E3C2]',
      textColor: 'text-white',
      keywords: {
        'in outer space': '🚀',
        'in a jungle': '🌳',
        'underwater': '🌊',
        'in a castle': '🏰',
        'on a mountain top': '⛰️',
        'in a neon-lit city': '🏙️',
        'inside a volcano': '🌋',
        'at a disco': '🕺',
        'in a library': '📚',
        'on a pirate ship': '🏴‍☠️',
      }
    },
    [T.categoryNames.Styles]: {
      color: 'bg-[#4A90E2]',
      textColor: 'text-white',
      keywords: {
        'pixel art': '👾',
        '3D render': '🧊',
        'cartoon': '😜',
        'photorealistic': '📷',
        'oil painting': '🖼️',
        'watercolor': '💧',
        'cyberpunk': '🤖',
        'steampunk': '⚙️',
        'art deco': '🎭',
        'vaporwave': '👓',
      }
    },
  };

  // Defines the order in which categories should appear in the UI.
  const categoryOrder = Object.keys(keywordCategories) as CategoryName[];

  // Memoizes the prompt text generated from the selected keywords.
  const promptText = useMemo(() => {
    const orderedKeywords: string[] = [];
    
    // Iterates over the defined order to maintain prompt consistency.
    categoryOrder.forEach(category => {
      const selectedKeyword = selectedKeywords.get(category);
      if (selectedKeyword) {
          orderedKeywords.push(selectedKeyword);
      }
    });

    if (orderedKeywords.length === 0) return '';
    
    // Extracts the style for special formatting in the sentence.
    const style = selectedKeywords.get(T.categoryNames.Styles);
    
    const displayKeywords = orderedKeywords.filter(kw => kw !== style);
    // Formats the prompt based on the language.
    if (language === 'pt') {
      const promptParts = displayKeywords.join(', ');
      return style ? `Um(a) ${promptParts}, no estilo ${style}` : `Um(a) ${promptParts}`;
    }
    
    const promptParts = displayKeywords.join(', ');
    return style ? `A ${promptParts}, in ${style} style` : `A ${promptParts}`;

  }, [selectedKeywords, categoryOrder, language, T]);

  /**
   * Handles the click on a keyword.
   * Adds, removes, or updates the selected keyword for a category.
   * @param category - The keyword category.
   * @param keyword - The selected keyword.
   */
  const handleKeywordClick = (category: CategoryName, keyword: string) => {
    const newMap = new Map(selectedKeywords);
    
    // If the keyword is already selected, deselect it. Otherwise, select it.
    if (newMap.get(category) === keyword) {
      newMap.delete(category);
    } else {
      newMap.set(category, keyword);
    }
    setSelectedKeywords(newMap);
  };

  /**
   * Maps the selected keywords (which may be in PT) to English
   * before sending to the image generation API.
   * @returns An array of keywords in English.
   */
  const mapKeywordsToEnglish = (): string[] => {
    const englishKeywords: string[] = [];
    if (language === 'en') {
        return Array.from(selectedKeywords.values());
    }

    const langTranslations = translations[language];
    const enTranslations = translations.en;

    selectedKeywords.forEach((value, key) => {
        const categoryKey = Object.keys(langTranslations.categoryNames).find(
            (k) => langTranslations.categoryNames[k as Category] === key
        ) as Category | undefined;

        if (categoryKey) {
            const keywordKey = Object.keys(langTranslations.keywordCategories[categoryKey].keywords).find(
                (k) => langTranslations.keywordCategories[categoryKey].keywords[k as keyof typeof langTranslations.keywordCategories[Category]['keywords']] === value
            );

            if (keywordKey) {
                const englishKeyword = enTranslations.keywordCategories[categoryKey].keywords[keywordKey as keyof typeof enTranslations.keywordCategories[Category]['keywords']];
                englishKeywords.push(englishKeyword);
            }
        }
    });
    return englishKeywords;
  };
  
  /**
   * Handles the image generation action.
   * Builds the prompt, calls the server action, and updates the state with the generated image.
   */
  const handleGenerate = () => {
    if (selectedKeywords.size === 0) {
      toast({
        title: T.toast.noKeywords.title,
        description: T.toast.noKeywords.description,
        variant: 'destructive'
      });
      return;
    }
    
    setShouldScroll(true);
    startTransition(async () => {
      setGeneratedImage(null);
      const finalizedPrompt = promptText;
      setCurrentPrompt(finalizedPrompt);
      const englishKeywords = mapKeywordsToEnglish();
      
      const result = await generateImageAction(englishKeywords);
      
      if (result.error) {
        toast({
          title: T.toast.generationFailed.title,
          description: result.error,
          variant: 'destructive'
        });
      } else if (result.imageUrl) {
        setGeneratedImage(result.imageUrl);
        if (!isMobile) {
            setImageDialogOpen(true);
        }
        
        const newImage: GalleryImage = {
            id: new Date().toISOString(),
            src: result.imageUrl,
            prompt: finalizedPrompt,
            createdAt: new Date().toISOString(),
        };

        // Adds the new image to the gallery and maintains the limit.
        setGalleryImages(prevImages => {
            const updatedImages = [newImage, ...prevImages];
            if (updatedImages.length > GALLERY_LIMIT) {
                updatedImages.pop();
            }
            return updatedImages;
        });
      }
    });
  };
  
  /**
   * Activates "Chaos Mode", which selects random keywords.
   * Calls a server action to get a random combination and updates the selections.
   */
  const handleChaos = () => {
    setShouldScroll(false);
    startTransition(async () => {
      setGeneratedImage(null);
      setCurrentPrompt('');
      const { error, result } = await generateChaosPromptAction();
      if (error || !result) {
        toast({
          title: T.toast.chaosFailed.title,
          description: error || T.toast.chaosFailed.description,
          variant: 'destructive'
        });
      } else {
        const newSelected = new Map<CategoryName, string>();
        
        // Helper function to find a key in an object by its value (case-insensitive).
        const findKeyByValue = (obj: {[key: string]: string}, value: string) => {
            if (!value) return undefined;
            const V = value.toLowerCase().trim();
            for (const key in obj) {
              if(obj[key].toLowerCase().trim() === V) return key;
            }
            return undefined;
        }
        
        // Maps the random English results back to the current UI language.
        const enCategories = translations.en.keywordCategories;
        const currentLangCategories = T.keywordCategories;

        const animalKey = findKeyByValue(enCategories.Animals.keywords, result.animal);
        if (animalKey) newSelected.set(T.categoryNames.Animals, currentLangCategories.Animals.keywords[animalKey as keyof typeof currentLangCategories.Animals.keywords]);
        
        const actionKey = findKeyByValue(enCategories.Actions.keywords, result.action);
        if (actionKey) newSelected.set(T.categoryNames.Actions, currentLangCategories.Actions.keywords[actionKey as keyof typeof currentLangCategories.Actions.keywords]);
        
        const settingKey = findKeyByValue(enCategories.Settings.keywords, result.setting);
        if (settingKey) newSelected.set(T.categoryNames.Settings, currentLangCategories.Settings.keywords[settingKey as keyof typeof currentLangCategories.Settings.keywords]);

        const styleKey = findKeyByValue(enCategories.Styles.keywords, result.style);
        if (styleKey) newSelected.set(T.categoryNames.Styles, currentLangCategories.Styles.keywords[styleKey as keyof typeof currentLangCategories.Styles.keywords]);

        setSelectedKeywords(newSelected);
      }
    });
  };

  /**
   * Clears the generated image to allow for a new keyword selection.
   */
  const handleRemix = () => {
    setGeneratedImage(null);
    setCurrentPrompt('');
    setImageDialogOpen(false);
  };
  
  /**
   * Handles the download of the generated image.
   */
  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentPrompt.replace(/[ ,.]/g, '_').slice(0,50) || 'wacky-image'}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast({
        title: T.toast.downloadFailed.title,
        description: T.toast.downloadFailed.description,
        variant: 'destructive'
      });
    }
  };

  /**
   * Opens the gallery image in a new window for better viewing.
   * @param imageUrl - The URL of the image to be opened.
   */
  const handleOpenInNewWindow = (imageUrl: string) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${T.gallery.openInNewWindowTitle}</title>
          <style>
            body { margin: 0; background-color: #f0f0f0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            img { max-width: 100%; max-height: 100%; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${imageUrl}" alt="${currentPrompt}">
        </body>
        </html>
      `);
      newWindow.document.close();
    } else {
        toast({
            title: T.toast.newWindowFailed.title,
            description: T.toast.newWindowFailed.description,
            variant: 'destructive'
        });
    }
  };

  /**
   * Handles sharing the image using the Web Share API.
   * If the API is not available, it falls back to downloading the image.
   */
  const handleShare = async () => {
    if (!generatedImage) return;

    try {
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        const file = new File([blob], `${currentPrompt.replace(/[ ,.]/g, '_').slice(0,50) || 'wacky-image'}.png`, { type: blob.type });

        if (navigator.share) {
            await navigator.share({
                title: T.title,
                text: currentPrompt,
                files: [file],
            });
        } else {
            // Fallback to download if the share API is not available.
            handleDownload();
        }
    } catch (error) {
        toast({
            title: T.toast.shareFailed.title,
            description: T.toast.shareFailed.description,
            variant: 'destructive'
        });
    }
  };

  /**
   * Removes an image from the gallery.
   * @param id - The ID of the image to be removed.
   */
  const handleDeleteFromGallery = (id: string) => {
    setGalleryImages(prevImages => prevImages.filter(img => img.id !== id));
    toast({
        title: T.toast.deleteSuccess.title,
    })
  }

  /**
   * Copies the Pix key to the clipboard.
   */
  const handleCopyPixKey = () => {
    navigator.clipboard.writeText(T.donations.pixKey);
    toast({
      title: T.donations.toastCopied,
    });
  };

  /**
   * Toggles the UI language and updates the selected keywords to the new language.
   */
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'pt' : 'en';
    setLanguage(newLang);

    // Translates the already selected keywords to the new language.
    const newSelectedKeywords = new Map<CategoryName, string>();
    const oldLang = translations[language];
    const newLangTranslations = translations[newLang];

    selectedKeywords.forEach((value, key) => {
        const categoryKey = Object.keys(oldLang.categoryNames).find(
            (k) => oldLang.categoryNames[k as Category] === key
        ) as Category | undefined;
        
        if (categoryKey) {
            const keywordKey = Object.keys(oldLang.keywordCategories[categoryKey].keywords).find(
                (k) => oldLang.keywordCategories[categoryKey].keywords[k as keyof typeof oldLang.keywordCategories[Category]['keywords']] === value
            );

            if (keywordKey) {
                const newCategoryName = newLangTranslations.categoryNames[categoryKey];
                const newKeyword = newLangTranslations.keywordCategories[categoryKey].keywords[keywordKey as keyof typeof newLangTranslations.keywordCategories[Category]['keywords']];
                newSelectedKeywords.set(newCategoryName, newKeyword);
            }
        }
    });
    setSelectedKeywords(newSelectedKeywords);
  };

  /**
   * Scrolls the page to the donations section.
   */
  const handleScrollToDonations = () => {
    donationSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Renders the keyword buttons for a given category.
   * @param category - The category for which to render the buttons.
   * @returns An array of button elements.
   */
  const renderKeywordButtons = (category: CategoryName) => {
    const categoryKey = Object.keys(T.categoryNames).find(k => T.categoryNames[k as Category] === category) as Category;
    const translatedKeywords = T.keywordCategories[categoryKey].keywords;

    return Object.entries(translatedKeywords).map(([key, keyword]) => {
      const isSelected = selectedKeywords.get(category) === keyword;
      const emojiCategory = keywordCategories[T.categoryNames[categoryKey] as CategoryName];
      const emoji = emojiCategory?.keywords[key];
      
      return (
        <Button
          key={keyword as string}
          onClick={() => handleKeywordClick(category, keyword as string)}
          className={cn(
            'h-16 text-lg rounded-xl border-4 justify-start p-4 transition-all duration-200 ease-in-out transform hover:-translate-y-1',
            isSelected
              ? `${keywordCategories[category].color} ${keywordCategories[category].textColor} border-yellow-300`
              : `bg-card text-card-foreground hover:bg-muted border-border`
          )}
        >
          <span className="w-8 h-8 mr-3 flex items-center justify-center text-3xl">{emoji}</span>
          <span className="font-body">{keyword as string}</span>
        </Button>
      );
    });
  };
  
  /**
   * Renders the complete keyword selection section for a category.
   * @param category - The category to be rendered.
   * @returns A JSX element with the keyword selector.
   */
  const renderKeywordSelector = (category: CategoryName) => (
      <div key={category}>
        <h2 className="text-3xl font-bold tracking-wider mb-4 md:hidden" style={{color: keywordCategories[category].color.replace(/bg-\[|\]/g, '')}}>{category.toUpperCase()}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderKeywordButtons(category)}
        </div>
      </div>
  );

  // JSX for the box that displays the current prompt.
  const promptBox = (
    <Card className="shadow-lg border-4 border-border rounded-2xl bg-card">
      <CardContent className="p-6">
        <div className="p-4 rounded-lg bg-muted min-h-[8rem] flex items-center justify-center border-2 border-border">
          <p className="text-center text-xl text-foreground font-body">
            {promptText || T.promptPlaceholder}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  // JSX for the card that displays the generated image result.
  const imageResultCard = generatedImage && (
    <Card className="shadow-xl overflow-hidden animate-in fade-in zoom-in-95 rounded-2xl border-4 border-border max-h-[90vh] overflow-y-auto">
        <CardHeader>
            <CardTitle className="text-3xl">{T.imageCard.title}</CardTitle>
            <CardDescription className="font-body text-lg italic">{currentPrompt}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            <Image src={generatedImage} alt={currentPrompt} width={1024} height={1024} className="w-full h-auto bg-muted" data-ai-hint="abstract art" />
        </CardContent>
        <CardFooter className="flex-wrap gap-2 p-4 bg-muted/50">
            <Button onClick={handleDownload} className="rounded-lg text-lg h-12 border-b-4 border-blue-800 hover:border-b-2"><Download className="mr-2"/>{T.imageCard.save}</Button>
            <Button onClick={handleRemix} variant="outline" className="rounded-lg text-lg h-12 border-b-4"><Repeat className="mr-2"/>{T.imageCard.remix}</Button>
            <Button onClick={handleShare} variant="outline" className="rounded-lg text-lg h-12 border-b-4"><Share2 className="mr-2"/>{T.imageCard.share}</Button>
        </CardFooter>
    </Card>
  );

  // JSX for the image gallery section.
  const gallerySection = (
    <div className="space-y-6 mt-12">
      <h2 className="text-4xl font-black text-center text-foreground tracking-tight">{T.gallery.title}</h2>
      {galleryImages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {galleryImages.map((image) => (
            <Card key={image.id} className="group overflow-hidden relative shadow-lg border-2 border-border rounded-xl">
              <Image src={image.src} alt={image.prompt} width={512} height={512} className="w-full h-auto object-cover aspect-square" />
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-center text-sm font-body mb-4">{image.prompt}</p>
                 <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenInNewWindow(image.src)}>
                        <ExternalLink className="mr-2 h-4 w-4" /> {T.gallery.openInNewWindow}
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4"/> {T.gallery.deleteButton}</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{T.gallery.modalTitle}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {T.gallery.deleteConfirmation}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{T.gallery.cancelButton}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteFromGallery(image.id)}>{T.gallery.confirmDeleteButton}</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl shadow-inner bg-muted/40 border-4 border-dashed border-border">
          <p className="text-muted-foreground text-center font-body text-lg">{T.gallery.empty}</p>
        </Card>
      )}
    </div>
  );

    // JSX for the donation section.
    const donationSection = (
      <div className="mt-12" ref={donationSectionRef}>
        <Card className="shadow-lg border-2 border-border rounded-2xl bg-card text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-black">{T.donations.title}</CardTitle>
            <CardDescription className="font-body text-lg">{T.donations.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 p-6">
            {/* PIX Section */}
            <div className='w-full'>
              <p className="font-bold text-accent mb-2">{T.donations.pixTitle}</p>
               <div className="flex justify-center mb-4">
                <Image
                    src="https://firebasestorage.googleapis.com/v0/b/wacky-image-forge.firebasestorage.app/o/8f40ec9d-e457-4987-b792-c9d3dbd30b59.jpg?alt=media&token=f05a9045-0b35-452e-9acc-b27e45649dd9"
                    alt="QR Code PIX"
                    width={200}
                    height={200}
                    className="rounded-lg border-4 border-border"
                />
              </div>
              <div className="flex w-full max-w-sm mx-auto items-center space-x-2">
                <Input type="text" value={T.donations.pixKey} readOnly className="text-center font-mono" />
                <Button onClick={handleCopyPixKey} variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">{T.donations.copyButton}</span>
                </Button>
              </div>
            </div>
            
            <Separator className='my-2'/>

            {/* PayPal Section */}
            <div className='w-full'>
              <p className="font-bold text-accent mb-2">{T.donations.paypalTitle}</p>
              <a 
                href={`https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=${T.donations.paypalEmail}&item_name=Donation+for+Wacky+Image+Forge&currency_code=${language === 'pt' ? 'BRL' : 'USD'}`}
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button className="w-full max-w-sm mx-auto bg-[#00457C] hover:bg-[#003057] text-white rounded-lg text-lg h-12 border-b-4 border-[#00213d] hover:border-b-2">
                  {T.donations.paypalButton}
                </Button>
              </a>
            </div>

          </CardContent>
        </Card>
      </div>
    );

  // JSX for the main action buttons (Generate and Chaos Mode).
  const actionButtons = (
      <div className="flex flex-col gap-4">
        <div>
          <Button onClick={handleGenerate} disabled={isPending || selectedKeywords.size === 0} size="lg" className="w-full text-2xl h-16 rounded-xl border-b-4 border-pink-800 hover:border-b-2">
            {isPending ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> {T.buttons.generating}</> : <><Sparkles className="mr-2 h-6 w-6" /> {T.buttons.generate}</>}
          </Button>
          <p className="text-sm text-muted-foreground mt-2 text-center px-4">{T.buttons.generateTooltip}</p>
        </div>
        <div>
          <Button onClick={handleChaos} disabled={isPending} variant="secondary" size="lg" className="w-full text-2xl h-16 rounded-xl border-b-4 border-purple-800 hover:border-b-2">
            <Wand2 className="mr-2 h-6 w-6" /> {T.buttons.chaos}
          </Button>
          <p className="text-sm text-muted-foreground mt-2 text-center px-4">{T.buttons.chaosTooltip}</p>
        </div>
      </div>
  );

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 md:p-8 font-headline">
        {/* Page Header */}
        <header className="text-center my-8 md:my-12 relative">
          <div className="absolute top-0 right-0 flex gap-2">
              <ThemeToggleButton />
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Button onClick={handleScrollToDonations} variant="outline" size="icon" className='rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300'>
                          <Heart className="h-5 w-5" />
                          <span className="sr-only">{T.donations.supportButton}</span>
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>{T.donations.supportButton}</p>
                  </TooltipContent>
              </Tooltip>
              <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={toggleLanguage} variant="outline" size="icon" className='rounded-full'>
                        <Languages className="h-5 w-5" />
                        <span className="sr-only">{T.languageButton}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>{T.languageButton}</p>
                  </TooltipContent>
              </Tooltip>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-foreground tracking-tighter" style={{ textShadow: '2px 2px 0 hsl(var(--secondary)), 4px 4px 0 hsl(var(--primary))'}}>
            {T.title}
          </h1>
          <p className="text-muted-foreground mt-4 text-lg md:text-xl font-body">{T.subtitle}</p>
        </header>

        {/* Main page content with a two-column layout on desktop */}
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-8">
            <div className="text-center bg-muted p-4 rounded-xl border-2 border-border">
                <p className="font-body text-lg text-foreground">{T.instruction}</p>
            </div>

            {/* Layout for mobile devices */}
            {isMobile && (
              <div className="space-y-8">
                {actionButtons}
                <Tabs defaultValue={T.categoryNames.Animals} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                    <TabsTrigger value={T.categoryNames.Animals}>{T.categoryNames.Animals}</TabsTrigger>
                    <TabsTrigger value={T.categoryNames.Actions}>{T.categoryNames.Actions}</TabsTrigger>
                    <TabsTrigger value={T.categoryNames.Settings}>{T.categoryNames.Settings}</TabsTrigger>
                    <TabsTrigger value={T.categoryNames.Styles}>{T.categoryNames.Styles}</TabsTrigger>
                  </TabsList>
                  <TabsContent value={T.categoryNames.Animals}>{renderKeywordSelector(T.categoryNames.Animals)}</TabsContent>
                  <TabsContent value={T.categoryNames.Actions}>{renderKeywordSelector(T.categoryNames.Actions)}</TabsContent>
                  <TabsContent value={T.categoryNames.Settings}>{renderKeywordSelector(T.categoryNames.Settings)}</TabsContent>
                  <TabsContent value={T.categoryNames.Styles}>{renderKeywordSelector(T.categoryNames.Styles)}</TabsContent>
                </Tabs>
                {actionButtons}
              </div>
            )}
            
            {/* Layout for desktop */}
            {!isMobile && (
              <div className="space-y-6">
                {(Object.keys(keywordCategories) as CategoryName[]).map((category) => (
                  <div key={category}>
                    <h2 className="text-3xl font-bold tracking-wider mb-4" style={{color: keywordCategories[category].color.replace(/bg-\[|\]/g, '')}}>{category.toUpperCase()}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {renderKeywordButtons(category)}
                      </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column (results and actions on desktop) */}
          <div className="sticky top-8 space-y-8">
            {!isMobile && (
              <>
                {actionButtons}
                {promptBox}
              </>
            )}
            <div ref={imageAreaRef}>
              {/* Loading indicator */}
              {isPending && !generatedImage && (
                <Card className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl shadow-inner bg-background/50 transition-all duration-300 border-4 border-dashed border-border aspect-square">
                    <Loader2 className="w-16 h-16 animate-spin text-primary" />
                    <p className="font-body text-accent text-lg">{T.status.forging}</p>
                    <p className="text-muted-foreground text-sm">{T.status.takeAMoment}</p>
                </Card>
              )}

              {/* Displays the image result on mobile */}
              {!isPending && generatedImage && isMobile && imageResultCard}

            </div>
          </div>
        </main>

        {/* Dialog to display the generated image full-screen on desktop */}
        {!isMobile && (
            <Dialog open={isImageDialogOpen} onOpenChange={setImageDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader className="sr-only">
                  <DialogDescription>{currentPrompt}</DialogDescription>
                </DialogHeader>
                {imageResultCard}
              </DialogContent>
            </Dialog>
        )}

        {/* Gallery Section */}
        {gallerySection}

        {/* Donation Section */}
        {donationSection}

      </div>
    </TooltipProvider>
  );
}

    