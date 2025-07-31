
"use client";

import { useState, useMemo, useTransition, ReactNode } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { generateImageAction, generateChaosImageAction } from '@/app/actions';
import { Sparkles, Wand2, Download, Repeat, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import { cn } from '@/lib/utils';

const DinosaurIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.36 14.5a2.49 2.49 0 0 0-1.84-3.32c-1.03-.23-1.92.2-2.52.97c-.32.41-.64.88-.89 1.44c-.26.58-.5 1.25-.66 2.01c-.13.62-.22 1.33-.22 2.1c0 1.29.31 2.74 1.15 4.01c.22.34.48.65.77.94c.3.29.63.56.98.79c.28.18.57.35.87.49c.29.14.59.26.9.36c.64.21 1.35.31 2.08.28c1.39-.06 2.63-.64 3.4-1.5c.22-.25.42-.52.59-.81c.18-.29.32-.6.44-.92c.2-.53.33-1.1.39-1.71c.06-.67.03-1.42-.09-2.24c-.13-.85-.35-1.78-.65-2.65c-.09-.27-.2-.53-.31-.79c-.11-.26-.23-.51-.37-.76c-.27-.49-.59-1-1.02-1.39c-.53-.5-1.22-.84-2.02-.91m-2.51-8.28c.43-.37.93-.61 1.46-.72c.54-.11 1.09-.07 1.62.11c.53.18 1 .49 1.38.89c.38.4.65.88.8 1.41c.15.53.18 1.09.08 1.63c-.1.54-.34 1.05-.71 1.47c-.37.42-.84.75-1.37.95c-.53.2-1.09.27-1.63.19c-.54-.08-1.06-.3-1.51-.64c-.45-.34-.81-.79-1.06-1.3c-.25-.51-.38-1.07-.38-1.64c0-.6.16-1.19.45-1.72c.3-.53.7-1 1.17-1.35Z"/></svg>;
const SpaghettiIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.2 12c-1.3 0-2.5.5-3.4 1.4C15.9 14.3 15.4 15.5 15.4 17c0 .3 0 .5.1.8c.8-1.8 2.2-3.2 4-4.1c.1-.1.1-.1.2-.2m-7.2-5c-1.3 0-2.5.5-3.4 1.4C8.7 9.3 8.2 10.5 8.2 12c0 1.5.5 2.7 1.4 3.6c.9.9 2.1 1.4 3.4 1.4c1.3 0 2.5-.5 3.4-1.4c.9-.9 1.4-2.1 1.4-3.4c0-1.3-.5-2.5-1.4-3.4c-.9-.9-2.1-1.4-3.4-1.4zM9 17.2c.4 1.4 1.4 2.6 2.8 3.1c.2.1.3.1.5.1h.1c.1 0 .3 0 .4-.1c1.3-.5 2.4-1.5 2.9-2.8c-1.1.7-2.4.7-3.6 0c-1.1.7-2.4.7-3.6 0c.2-.1.3-.1.5-.2zM6.1 7.1c-1.6 1.6-2.1 3.9-1.2 5.9c.3.7.8 1.3 1.4 1.8c-1.3-1.6-1.6-3.7-1-5.6C5.5 8.5 5.7 7.8 6.1 7.1zm-1-1C3.3 4.3 2 2.4 2 2.4c2.2 1.3 3.6 3.6 3.8 6.2c0 0-1.7-3.3-4.7-4.5z"/><path d="M12.4 3.6c-2.3.1-4.2 2-4.2 4.4c0 2.4 1.9 4.4 4.2 4.4s4.2-2 4.2-4.4c0-2.4-1.9-4.3-4.2-4.4zm-2.1 6.1c-.2-1 .6-2.9 1.5-3.4c.9-.5 2.1.3 2.3 1.3c.2 1-.6 2.9-1.5 3.4c-.9.5-2.1-.2-2.3-1.3z"/></svg>;
const SkateboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.38 12.39a1.5 1.5 0 0 0-1.13 1.39c-.04.83.6 1.54 1.43 1.58.83.04 1.54-.6 1.58-1.43.04-.83-.6-1.54-1.43-1.58-.1-.01-.2 0-.3-.01m11.19.06a1.5 1.5 0 0 0-1.13 1.39c-.04.83.6 1.54 1.43 1.58.83.04 1.54-.6 1.58-1.43.04-.83-.6-1.54-1.43-1.58-.1 0-.2 0-.3-.01M5.5 10.5l13 .88c.44.03.81.39.85.83l.39 4.35c.03.28-.1.55-.32.73l-1.65 1.32a.89.89 0 0 1-1.09-.21l-1.32-1.65a.89.89 0 0 0-1.09-.21l-1.32 1.65a.89.89 0 0 1-1.09-.21l-1.32-1.65a.89.89 0 0 0-1.09-.21l-1.32 1.65a.89.89 0 0 1-1.09-.21L8.3 16.5a.89.89 0 0 0-1.09-.21L5.89 17.6a.89.89 0 0 1-1.09-.21l-1.32-1.65c-.22-.27-.22-.68 0-.95l2.23-2.78c.31-.39.8-.59 1.29-.53z"/></svg>;
const SpaceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10c0-5.52-4.48-10-10-10zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"/><path d="M12 4a8 8 0 0 0-8 8c0 1.5.4 2.9 1.2 4.1.4-1.1.6-2.3.6-3.5 0-3.9-3.1-7-7-7-.4 0-.8 0-1.1.1 1-4.2 4.8-7.3 9.3-7.3s8.3 3.1 9.3 7.3c-.3 0-.7.1-1.1.1-3.9 0-7 3.1-7 7 0 1.2.2 2.4.6 3.5 1-1.2 2.4-1.6 3.9-1.6 4.4 0 8 3.6 8 8 0 .4 0 .8-.1 1.2 1.1-.7 2-1.8 2.6-3C21.5 13.5 17.2 9.1 12 9s-9.5 4.5-9.8 10.3c.6-1.2 1.4-2.2 2.6-3 .4 0 .8-.1 1.2-.1 3.9 0 7-3.1 7-7s-3.1-7-7-7z"/></svg>;
const SaturnIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12m-6 0a6 6 0 1 0 12 0 6 6 0 1 0-12 0"/><path d="M19.71 14.83a8.88 8.88 0 0 0-1.6-1.89 9 9 0 0 0-12.22 0 8.88 8.88 0 0 0-1.6 1.89"/><path d="M4.29 9.17a8.88 8.88 0 0 0 1.6 1.89 9 9 0 0 0 12.22 0 8.88 8.88 0 0 0 1.6-1.89"/></svg>;

const keywordCategories = {
  Animals: {
    color: 'bg-[#70C46B]',
    textColor: 'text-white',
    keywords: { 'T-rex': <DinosaurIcon />, 'Penguin': null, 'Kitten': null, 'Puppy': null, 'Elephant': null, 'Lion': null, 'Unicorn': null, 'Dragon': null, 'Llama': null, 'Robot': null }
  },
  Actions: {
    color: 'bg-[#F5A623]',
    textColor: 'text-white',
    keywords: { 'eating spaghetti': <SpaghettiIcon />, 'skateboarding': <SkateboardIcon />, 'dancing': null, 'flying': null, 'reading a book': null, 'painting': null, 'coding': null, 'juggling planets': null, 'riding a monocycle': null, 'breathing fire': null }
  },
  Settings: {
    color: 'bg-[#50E3C2]',
    textColor: 'text-white',
    keywords: { 'on Saturn': <SaturnIcon />, 'in a jungle': null, 'underwater': null, 'in a castle': null, 'on a mountain top': null, 'in a neon-lit city': null, 'inside a volcano': null, 'at a disco': null, 'in a library of lost books': null, 'on a pirate ship': null }
  },
  Styles: {
    color: 'bg-[#4A90E2]',
    textColor: 'text-white',
    keywords: { 'pixel art': null, '3D render': null, 'cartoon': null, 'photorealistic': null, 'oil painting': null, 'watercolor': null, 'cyberpunk': null, 'steampunk': null, 'art deco': null, 'vaporwave': null }
  },
};

type Category = keyof typeof keywordCategories;

export default function WackyImageForge() {
  const [selectedKeywords, setSelectedKeywords] = useState<Map<Category, string>>(new Map());
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const promptText = useMemo(() => {
    const orderedKeywords: string[] = [];
    (Object.keys(keywordCategories) as Category[]).forEach(category => {
      if (selectedKeywords.has(category)) {
        orderedKeywords.push(selectedKeywords.get(category)!);
      }
    });
    return orderedKeywords.join(', ');
  }, [selectedKeywords]);

  const handleKeywordClick = (category: Category, keyword: string) => {
    const newMap = new Map(selectedKeywords);
    if (newMap.get(category) === keyword) {
      newMap.delete(category);
    } else {
      newMap.set(category, keyword);
    }
    setSelectedKeywords(newMap);
  };

  const handleGenerate = () => {
    if (selectedKeywords.size === 0) {
      toast({
        title: "No keywords!",
        description: "Please select some keywords to generate an image.",
        variant: "destructive",
      })
      return;
    }
    startTransition(async () => {
      const keywords = Array.from(selectedKeywords.values());
      const { imageUrl, error, prompt } = await generateImageAction(keywords);
      if (error) {
        toast({ title: "Generation Failed", description: error, variant: "destructive" });
      } else {
        setGeneratedImage(imageUrl);
        setCurrentPrompt(prompt);
      }
    });
  };

  const handleChaos = () => {
    startTransition(async () => {
      const { imageUrl, error, prompt } = await generateChaosImageAction();
      if (error || !prompt) {
        toast({ title: "Chaos Failed!", description: error || "Could not generate a chaotic prompt.", variant: "destructive"});
      } else {
        setGeneratedImage(imageUrl);
        setCurrentPrompt(prompt);
        const newSelected = new Map();
        Object.entries(keywordCategories).forEach(([cat, data]) => {
          const found = Object.keys(data.keywords).find(word => prompt.toLowerCase().includes(word.toLowerCase()));
          if (found) newSelected.set(cat as Category, found);
        })
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
      a.download = `${currentPrompt.replace(/[ ,.]/g, '_').slice(0,50) || 'wacky-image'}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
      toast({ title: "Download Failed", description: "Could not download the image.", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 font-headline">
      <header className="text-center my-8 md:my-12 relative">
        <h1 className="text-6xl md:text-8xl font-bold text-primary-foreground tracking-tight" style={{ textShadow: '4px 4px 0 hsl(var(--primary))'}}>
          Wacky Image Forge
        </h1>
        <p className="text-muted-foreground mt-4 text-lg md:text-xl font-body">Craft chaotic creations with a click!</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
          <Card className="shadow-lg border-4 border-border rounded-2xl bg-card">
            <CardContent className="p-6">
              <div className="p-4 rounded-lg bg-muted min-h-[8rem] flex items-center justify-center border-2 border-border">
                <p className="text-center text-xl text-foreground font-body">
                  {promptText || 'Select keywords to begin...'}
                </p>
              </div>
            </CardContent>
          </Card>
           <div className="flex flex-col gap-4">
              <Button onClick={handleGenerate} disabled={isPending || selectedKeywords.size === 0} size="lg" className="text-2xl h-16 rounded-xl border-b-4 border-pink-800 hover:border-b-2">
                {isPending ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Generating...</> : <><Sparkles className="mr-2 h-6 w-6" /> Generate Image</>}
              </Button>
              <Button onClick={handleChaos} disabled={isPending} variant="secondary" size="lg" className="text-2xl h-16 rounded-xl border-b-4 border-purple-800 hover:border-b-2">
                <Wand2 className="mr-2 h-6 w-6" /> Chaos Mode
              </Button>
            </div>

          <div className="space-y-6">
            {(Object.keys(keywordCategories) as Category[]).map((category) => (
              <div key={category}>
                <h2 className="text-3xl font-bold tracking-wider mb-4" style={{color: keywordCategories[category].color.replace(/bg-\[|\]/g, '')}}>{category.toUpperCase()}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(keywordCategories[category].keywords).map(([keyword, icon]) => {
                    const isSelected = selectedKeywords.get(category) === keyword;
                    return (
                      <Button
                        key={keyword}
                        onClick={() => handleKeywordClick(category, keyword)}
                        className={cn(
                          'h-16 text-lg rounded-xl border-4 justify-start p-4 transition-all duration-200 ease-in-out transform hover:-translate-y-1',
                          isSelected
                            ? `${keywordCategories[category].color} ${keywordCategories[category].textColor} border-yellow-300`
                            : `bg-card text-card-foreground hover:bg-muted border-border`
                        )}
                      >
                        {icon && <span className="w-8 h-8 mr-3">{icon}</span>}
                        <span className="font-body">{keyword}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sticky top-8">
           {isPending && (
            <Card className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl shadow-inner bg-background/50 aspect-square border-4 border-dashed border-border">
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
                <p className="font-body text-accent text-lg">Forging your wacky image...</p>
                <p className="text-muted-foreground text-sm">This can take a moment.</p>
            </Card>
          )}

          {!isPending && generatedImage && (
            <Card className="shadow-xl overflow-hidden animate-in fade-in zoom-in-95 rounded-2xl border-4 border-border">
                <CardHeader>
                    <CardTitle className="text-3xl">Behold!</CardTitle>
                    <CardDescription className="font-body text-lg italic">{currentPrompt}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Image src={generatedImage} alt={currentPrompt} width={1024} height={1024} className="w-full h-auto bg-muted" data-ai-hint="abstract art" />
                </CardContent>
                <CardFooter className="flex-wrap gap-2 p-4 bg-muted/50">
                    <Button onClick={handleDownload} className="rounded-lg text-lg h-12 border-b-4 border-blue-800 hover:border-b-2"><Download className="mr-2"/> Save</Button>
                    <Button onClick={handleRemix} variant="outline" className="rounded-lg text-lg h-12 border-b-4"><Repeat className="mr-2"/> Remix</Button>
                </CardFooter>
            </Card>
          )}

          {!isPending && !generatedImage && (
             <Card className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl shadow-inner bg-muted/40 border-4 border-dashed border-border aspect-square">
                <div className="text-center">
                    <h3 className="text-3xl text-primary">Your creation will appear here</h3>
                    <p className="text-muted-foreground mt-2 font-body text-lg">Let your imagination run wild!</p>
                </div>
             </Card>
          )}
        </div>
      </main>
    </div>
  );
}
