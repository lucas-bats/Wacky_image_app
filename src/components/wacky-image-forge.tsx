
"use client";

import { useState, useMemo, useTransition } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { generateImageAction, generateChaosImageAction } from '@/app/actions';
import { Sparkles, Wand2, Download, Repeat, Loader2, Paintbrush } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"

const keywordsData = {
  Animals: ['T-rex', 'Penguin', 'Kitten', 'Puppy', 'Elephant', 'Lion', 'Unicorn', 'Dragon', 'Llama', 'Robot'],
  Actions: ['eating spaghetti', 'skateboarding', 'dancing', 'flying', 'reading a book', 'painting', 'coding', 'juggling planets', 'riding a monocycle', 'breathing fire'],
  Settings: ['on Saturn', 'in a jungle', 'underwater', 'in a castle', 'on a mountain top', 'in a neon-lit city', 'inside a volcano', 'at a disco', 'in a library of lost books', 'on a pirate ship'],
  Styles: ['pixel art', '3D render', 'cartoon', 'photorealistic', 'oil painting', 'watercolor', 'cyberpunk', 'steampunk', 'art deco', 'vaporwave'],
};

type Category = keyof typeof keywordsData;

export default function WackyImageForge() {
  const [selectedKeywords, setSelectedKeywords] = useState<Map<Category, string>>(new Map());
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const promptText = useMemo(() => {
    const orderedKeywords: string[] = [];
    (Object.keys(keywordsData) as Category[]).forEach(category => {
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
        // Deconstruct prompt back into keywords for display, not perfect but good for UX
        const newSelected = new Map();
        Object.entries(keywordsData).forEach(([cat, words]) => {
          const found = words.find(word => prompt.toLowerCase().includes(word.toLowerCase()));
          if (found) newSelected.set(cat, found);
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
    <div className="container mx-auto p-4 md:p-8 font-body">
      <header className="text-center my-8 md:my-12">
        <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary tracking-tight">Wacky Image Forge</h1>
        <p className="text-muted-foreground mt-4 text-lg md:text-xl">Craft chaotic creations with a click!</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2"><Paintbrush className="text-accent" /> Your Prompt</CardTitle>
              <CardDescription>Click keywords below to build your masterpiece.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-muted min-h-[6rem] flex items-center justify-center">
                <p className="text-center text-lg text-muted-foreground italic">
                  {promptText || 'Select keywords to begin...'}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex-wrap gap-2">
              <Button onClick={handleGenerate} disabled={isPending || selectedKeywords.size === 0} size="lg" className="flex-1">
                {isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...</> : <><Sparkles className="mr-2 h-5 w-5" /> Generate Image</>}
              </Button>
              <Button onClick={handleChaos} disabled={isPending} variant="secondary" size="lg">
                <Wand2 className="mr-2 h-5 w-5" /> Chaos Mode
              </Button>
            </CardFooter>
          </Card>

          <div className="space-y-6">
            {Object.entries(keywordsData).map(([category, keywordList]) => (
              <div key={category}>
                <h3 className="text-2xl font-headline text-primary mb-3">{category}</h3>
                <div className="flex flex-wrap gap-2">
                  {keywordList.map(keyword => (
                    <Button
                      key={keyword}
                      variant={selectedKeywords.get(category as Category) === keyword ? 'default' : 'outline'}
                      onClick={() => handleKeywordClick(category as Category, keyword)}
                      className="rounded-full transition-all duration-200 ease-in-out transform hover:scale-105"
                    >
                      {keyword}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sticky top-8">
           {isPending && (
            <Card className="flex flex-col items-center justify-center gap-4 p-8 rounded-lg shadow-inner bg-background/50 aspect-square">
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
                <p className="font-body text-accent text-lg">Forging your wacky image...</p>
                <p className="text-muted-foreground text-sm">This can take a moment.</p>
            </Card>
          )}

          {!isPending && generatedImage && (
            <Card className="shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Behold!</CardTitle>
                    <CardDescription className="italic">{currentPrompt}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Image src={generatedImage} alt={currentPrompt} width={1024} height={1024} className="w-full h-auto bg-muted" data-ai-hint="abstract art" />
                </CardContent>
                <CardFooter className="flex-wrap gap-2 p-4 bg-muted/50">
                    <Button onClick={handleDownload}><Download className="mr-2"/> Save</Button>
                    <Button onClick={handleRemix} variant="outline"><Repeat className="mr-2"/> Remix</Button>
                </CardFooter>
            </Card>
          )}

          {!isPending && !generatedImage && (
             <Card className="flex flex-col items-center justify-center gap-4 p-8 rounded-lg shadow-inner bg-muted/40 border-dashed aspect-square">
                <div className="text-center">
                    <h3 className="text-2xl font-headline text-primary">Your creation will appear here</h3>
                    <p className="text-muted-foreground mt-2">Let your imagination run wild!</p>
                </div>
             </Card>
          )}
        </div>
      </main>
    </div>
  );
}
