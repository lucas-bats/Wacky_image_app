
"use client";

import { useState, useMemo, useTransition, ReactNode, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  generateImageAction
} from '@/app/actions';
import { Sparkles, Wand2, Download, Repeat, Loader2, Languages, Share2, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { translations } from '@/lib/translations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMediaQuery } from "@/hooks/use-media-query"
import { generateChaosPromptAction } from '@/app/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";


type Language = 'en' | 'pt';
type KeywordCategories = (typeof translations)[Language]['keywordCategories'];
type Category = keyof KeywordCategories;
type CategoryName = (typeof translations)[Language]['categoryNames'][Category];

interface GalleryImage {
  id: string;
  src: string;
  prompt: string;
  createdAt: string;
}

const GALLERY_LIMIT = 12;
const STORAGE_KEY = 'wackyGallery_local';

export default function WackyImageForge() {
  const [language, setLanguage] = useState<Language>('pt');
  const [selectedKeywords, setSelectedKeywords] = useState<Map<CategoryName, string>>(new Map());
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const [shouldScroll, setShouldScroll] = useState(false);
  const imageAreaRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isImageDialogOpen, setImageDialogOpen] = useState(false);

  const T = translations[language];

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

  useEffect(() => {
    if (!hasLoaded) return;
    
    // Create a mutable copy to work with
    let imagesToSave = [...galleryImages];

    // Attempt to save, and if it fails, start removing old items.
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(imagesToSave));
    } catch (e) {
      console.warn("Saving to localStorage failed, attempting to clear old images...", e);
      
      // Check if it's a quota error
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        // Loop and remove the oldest image until it fits.
        let success = false;
        for (let i = 0; i < galleryImages.length; i++) {
          imagesToSave.pop(); // Remove the oldest image
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(imagesToSave));
            success = true;
            console.log(`Successfully saved gallery after removing ${i + 1} old image(s).`);
            break; // Exit loop on success
          } catch (e2) {
            // Continue loop if it still fails
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
  

  useEffect(() => {
    if (shouldScroll && imageAreaRef.current && isMobile) {
      imageAreaRef.current.scrollIntoView({ behavior: 'smooth' });
      setShouldScroll(false);
    }
  }, [generatedImage, shouldScroll, isMobile]);


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
        'on Saturn': '🪐',
        'in a jungle': '🌴',
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

  const categoryOrder = Object.keys(keywordCategories) as CategoryName[];

  const promptText = useMemo(() => {
    const orderedKeywords: string[] = [];
    
    categoryOrder.forEach(category => {
      const selectedKeyword = selectedKeywords.get(category);
      if (selectedKeyword) {
          orderedKeywords.push(selectedKeyword);
      }
    });

    if (orderedKeywords.length === 0) return '';
    
    const style = selectedKeywords.get(T.categoryNames.Styles);
    
    const displayKeywords = orderedKeywords.filter(kw => kw !== style);
    if (language === 'pt') {
      const promptParts = displayKeywords.join(', ');
      return style ? `Um(a) ${promptParts}, no estilo ${style}` : `Um(a) ${promptParts}`;
    }
    
    const promptParts = displayKeywords.join(', ');
    return style ? `A ${promptParts}, in ${style} style` : `A ${promptParts}`;

  }, [selectedKeywords, categoryOrder, language, T]);

  const handleKeywordClick = (category: CategoryName, keyword: string) => {
    const newMap = new Map(selectedKeywords);
    
    if (newMap.get(category) === keyword) {
      newMap.delete(category);
    } else {
      newMap.set(category, keyword);
    }
    setSelectedKeywords(newMap);
  };

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
  
  const handleGenerate = () => {
    if (selectedKeywords.size === 0) {
      console.error(T.toast.noKeywords.title, T.toast.noKeywords.description);
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
        console.error(T.toast.generationFailed.title, result.error);
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
  
  const handleChaos = () => {
    setShouldScroll(false);
    startTransition(async () => {
      setGeneratedImage(null);
      setCurrentPrompt('');
      const { error, result } = await generateChaosPromptAction();
      if (error || !result) {
        console.error(T.toast.chaosFailed.title, error || T.toast.chaosFailed.description);
      } else {
        const newSelected = new Map<CategoryName, string>();
        
        const findKeyByValue = (obj: {[key: string]: string}, value: string) => {
            if (!value) return undefined;
            const V = value.toLowerCase().trim();
            for (const key in obj) {
              if(obj[key].toLowerCase().trim() === V) return key;
            }
            return undefined;
        }
        
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

  const handleRemix = () => {
    setGeneratedImage(null);
    setCurrentPrompt('');
    setImageDialogOpen(false);
  };
  
  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentPrompt.replace(/[ ,.]/g, '_').slice(0,50) || 'imagem-maluca'}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
    }
  };

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
        console.error(T.toast.newWindowFailed.title, T.toast.newWindowFailed.description);
    }
  };

  const handleShare = async () => {
    if (!generatedImage) return;

    try {
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        const file = new File([blob], `${currentPrompt.replace(/[ ,.]/g, '_').slice(0,50) || 'imagem-maluca'}.png`, { type: blob.type });

        if (navigator.share) {
            await navigator.share({
                title: T.title,
                text: currentPrompt,
                files: [file],
            });
        } else {
            handleDownload();
        }
    } catch (error) {
        console.error("Sharing failed", error);
    }
  };

  const handleDeleteFromGallery = (id: string) => {
    setGalleryImages(prevImages => prevImages.filter(img => img.id !== id));
  }

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'pt' : 'en';
    setLanguage(newLang);

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
  
  const renderKeywordSelector = (category: CategoryName) => (
      <div key={category}>
        <h2 className="text-3xl font-bold tracking-wider mb-4 md:hidden" style={{color: keywordCategories[category].color.replace(/bg-\[|\]/g, '')}}>{category.toUpperCase()}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderKeywordButtons(category)}
        </div>
      </div>
  );

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
  )

  return (
    <div className="container mx-auto p-4 md:p-8 font-headline">
      <header className="text-center my-8 md:my-12 relative">
        <div className="absolute top-0 right-0 flex gap-2">
            <Button onClick={toggleLanguage} variant="outline" size="icon" className='rounded-full'>
                <Languages className="h-5 w-5" />
                <span className="sr-only">{T.languageButton}</span>
            </Button>
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-foreground tracking-tighter" style={{ textShadow: '2px 2px 0 hsl(var(--secondary)), 4px 4px 0 hsl(var(--primary))'}}>
          {T.title}
        </h1>
        <p className="text-muted-foreground mt-4 text-lg md:text-xl font-body">{T.subtitle}</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
           <div className="flex flex-col gap-4">
              <Button onClick={handleGenerate} disabled={isPending || selectedKeywords.size === 0} size="lg" className="text-2xl h-16 rounded-xl border-b-4 border-pink-800 hover:border-b-2">
                {isPending ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> {T.buttons.generating}</> : <><Sparkles className="mr-2 h-6 w-6" /> {T.buttons.generate}</>}
              </Button>
              <Button onClick={handleChaos} disabled={isPending} variant="secondary" size="lg" className="text-2xl h-16 rounded-xl border-b-4 border-purple-800 hover:border-b-2">
                <Wand2 className="mr-2 h-6 w-6" /> {T.buttons.chaos}
              </Button>
            </div>
          
            {isMobile && promptBox}

            <div className="text-center bg-muted p-4 rounded-xl border-2 border-border">
                <p className="font-body text-lg text-foreground">{T.instruction}</p>
            </div>

          {isMobile ? (
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
          ) : (
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

        <div className="sticky top-8 space-y-8">
          {!isMobile && promptBox}
           <div ref={imageAreaRef}>
             {isPending && !generatedImage && (
              <Card className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl shadow-inner bg-background/50 transition-all duration-300 border-4 border-dashed border-border aspect-square">
                  <Loader2 className="w-16 h-16 animate-spin text-primary" />
                  <p className="font-body text-accent text-lg">{T.status.forging}</p>
                  <p className="text-muted-foreground text-sm">{T.status.takeAMoment}</p>
              </Card>
            )}

            {!isPending && generatedImage && isMobile && imageResultCard}

            {!isPending && !generatedImage && (
             <Card className={cn(
                "flex flex-col items-center justify-center gap-4 p-8 rounded-2xl shadow-inner bg-muted/40 border-4 border-dashed border-border transition-all duration-300 ease-in-out",
                !isMobile && "h-64"
             )}>
                <div className="text-center">
                    <h3 className="text-3xl text-primary">{T.placeholderCard.title}</h3>
                    <p className="text-muted-foreground mt-2 font-body text-lg">{T.placeholderCard.subtitle}</p>
                </div>
             </Card>
          )}
           </div>
        </div>
      </main>

      {!isMobile && (
          <Dialog open={isImageDialogOpen} onOpenChange={setImageDialogOpen}>
            <DialogContent className="max-w-2xl">
               <DialogHeader>
                  <DialogTitle>{T.imageCard.title}</DialogTitle>
                  <DialogDescription>{currentPrompt}</DialogDescription>
                </DialogHeader>
              {imageResultCard}
            </DialogContent>
          </Dialog>
      )}

      {gallerySection}

    </div>
  );
}

    