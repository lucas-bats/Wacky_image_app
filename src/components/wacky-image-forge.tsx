
"use client";

import { useState, useMemo, useTransition, ReactNode, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  generateImageAction
} from '@/app/actions';
import { Sparkles, Wand2, Download, Repeat, Loader2, Languages, Share2, LogOut } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import { cn } from '@/lib/utils';
import { translations } from '@/lib/translations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useAuth } from './auth-provider';
import { generateChaosPromptAction } from '@/app/actions';


type Language = 'en' | 'pt';
type KeywordCategories = (typeof translations)[Language]['keywordCategories'];
type Category = keyof KeywordCategories;
type CategoryName = (typeof translations)[Language]['categoryNames'][Category];

export default function WackyImageForge() {
  const [language, setLanguage] = useState<Language>('pt');
  const [selectedKeywords, setSelectedKeywords] = useState<Map<CategoryName, string>>(new Map());
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const [shouldScroll, setShouldScroll] = useState(false);
  const { toast } = useToast();
  const imageAreaRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { user, logout } = useAuth();

  const T = translations[language];

  useEffect(() => {
    if (shouldScroll && imageAreaRef.current) {
      imageAreaRef.current.scrollIntoView({ behavior: 'smooth' });
      setShouldScroll(false);
    }
  }, [generatedImage, shouldScroll]);


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
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to generate images.", variant: "destructive" });
        return;
    }
    if (selectedKeywords.size === 0) {
      toast({
        title: T.toast.noKeywords.title,
        description: T.toast.noKeywords.description,
        variant: "destructive",
      })
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
        toast({ title: T.toast.generationFailed.title, description: result.error, variant: "destructive" });
      } else if (result.imageUrl) {
        setGeneratedImage(result.imageUrl);
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
        toast({ title: T.toast.chaosFailed.title, description: error || T.toast.chaosFailed.description, variant: "destructive"});
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
      toast({ title: T.toast.downloadFailed.title, description: T.toast.downloadFailed.description, variant: "destructive" });
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
        toast({ title: T.toast.shareFailed.title, description: T.toast.shareFailed.description, variant: "destructive" });
    }
  };

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

  return (
    <div className="container mx-auto p-4 md:p-8 font-headline">
      <header className="text-center my-8 md:my-12 relative">
        <div className="absolute top-0 right-0 flex gap-2">
            <Button onClick={toggleLanguage} variant="outline" size="icon" className='rounded-full'>
                <Languages className="h-5 w-5" />
                <span className="sr-only">{T.languageButton}</span>
            </Button>
            <Button onClick={logout} variant="destructive" size="icon" className='rounded-full'>
                <LogOut className="h-5 w-5" />
                <span className="sr-only">{T.auth.logout}</span>
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

            {!isPending && generatedImage && (
              <Card className="shadow-xl overflow-hidden animate-in fade-in zoom-in-95 rounded-2xl border-4 border-border">
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
            )}

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
    </div>
  );
}
