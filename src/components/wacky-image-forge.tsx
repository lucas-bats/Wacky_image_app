

"use client";

// Importações de hooks e bibliotecas do React.
import { useState, useMemo, useTransition, ReactNode, useRef, useEffect } from 'react';
// Importação do componente Image do Next.js para otimização de imagens.
import Image from 'next/image';
// Importações de componentes de UI da biblioteca ShadCN.
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast"
import { 
  generateImageAction
} from '@/app/actions';
// Importação de ícones da biblioteca lucide-react.
import { Sparkles, Wand2, Download, Repeat, Loader2, Languages, Share2, Trash2, ExternalLink, Copy } from 'lucide-react';
// Importação de utilitários e traduções.
import { cn } from '@/lib/utils';
import { translations } from '@/lib/translations';
// Importações adicionais de componentes de UI.
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMediaQuery } from "@/hooks/use-media-query"
import { generateChaosPromptAction } from '@/app/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from './ui/separator';


// Define os tipos para o estado de internacionalização e categorias de palavras-chave.
type Language = 'en' | 'pt';
type KeywordCategories = (typeof translations)[Language]['keywordCategories'];
type Category = keyof KeywordCategories;
type CategoryName = (typeof translations)[Language]['categoryNames'][Category];

// Define a interface para as imagens da galeria.
interface GalleryImage {
  id: string;
  src: string;
  prompt: string;
  createdAt: string;
}

// Constantes para o limite da galeria e a chave de armazenamento local.
const GALLERY_LIMIT = 12;
const STORAGE_KEY = 'wackyGallery_local';

/**
 * Componente principal da aplicação "Wacky Image Forge".
 * Permite ao usuário selecionar palavras-chave para gerar imagens,
 * salvá-las em uma galeria local e alternar entre idiomas.
 */
export default function WackyImageForge() {
  // Estado para o idioma atual da interface.
  const [language, setLanguage] = useState<Language>('pt');
  // Estado para armazenar as palavras-chave selecionadas pelo usuário.
  const [selectedKeywords, setSelectedKeywords] = useState<Map<CategoryName, string>>(new Map());
  // Estado para a URL da imagem gerada.
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  // Estado para o prompt usado na geração da imagem.
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  // Hook de transição para lidar com estados de carregamento sem bloquear a UI.
  const [isPending, startTransition] = useTransition();
  // Estado para controlar a rolagem automática para a área da imagem em dispositivos móveis.
  const [shouldScroll, setShouldScroll] = useState(false);
  // Ref para a área da imagem para rolagem.
  const imageAreaRef = useRef<HTMLDivElement>(null);
  // Hook para detectar se a visualização é móvel.
  const isMobile = useMediaQuery("(max-width: 768px)")
  // Estado para as imagens da galeria do usuário.
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  // Estado para garantir que a galeria foi carregada do localStorage antes de salvar.
  const [hasLoaded, setHasLoaded] = useState(false);
  // Estado para controlar a visibilidade do diálogo da imagem em desktop.
  const [isImageDialogOpen, setImageDialogOpen] = useState(false);

  // Hook para exibir notificações (toasts).
  const { toast } = useToast();

  // Acesso rápido às traduções do idioma selecionado.
  const T = translations[language];

  // Efeito para carregar a galeria do localStorage na montagem do componente.
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

  // Efeito para salvar a galeria no localStorage sempre que ela for atualizada.
  useEffect(() => {
    if (!hasLoaded) return;
    
    const imagesToSave = [...galleryImages];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(imagesToSave));
    } catch (e) {
      // Trata o erro de cota excedida no localStorage, removendo imagens antigas para liberar espaço.
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
            // Continua tentando se a remoção de uma imagem não for suficiente.
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
  
  // Efeito para rolar a tela para a imagem gerada em dispositivos móveis.
  useEffect(() => {
    if (shouldScroll && imageAreaRef.current && isMobile) {
      imageAreaRef.current.scrollIntoView({ behavior: 'smooth' });
      setShouldScroll(false);
    }
  }, [generatedImage, shouldScroll, isMobile]);


  // Objeto de configuração para as categorias de palavras-chave, incluindo cores e emojis.
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

  // Define a ordem em que as categorias devem aparecer na UI.
  const categoryOrder = Object.keys(keywordCategories) as CategoryName[];

  // Memoiza o texto do prompt gerado a partir das palavras-chave selecionadas.
  const promptText = useMemo(() => {
    const orderedKeywords: string[] = [];
    
    // Itera sobre a ordem definida para manter a consistência do prompt.
    categoryOrder.forEach(category => {
      const selectedKeyword = selectedKeywords.get(category);
      if (selectedKeyword) {
          orderedKeywords.push(selectedKeyword);
      }
    });

    if (orderedKeywords.length === 0) return '';
    
    // Extrai o estilo para formatação especial na frase.
    const style = selectedKeywords.get(T.categoryNames.Styles);
    
    const displayKeywords = orderedKeywords.filter(kw => kw !== style);
    // Formata o prompt com base no idioma.
    if (language === 'pt') {
      const promptParts = displayKeywords.join(', ');
      return style ? `Um(a) ${promptParts}, no estilo ${style}` : `Um(a) ${promptParts}`;
    }
    
    const promptParts = displayKeywords.join(', ');
    return style ? `A ${promptParts}, in ${style} style` : `A ${promptParts}`;

  }, [selectedKeywords, categoryOrder, language, T]);

  /**
   * Manipula o clique em uma palavra-chave.
   * Adiciona, remove ou atualiza a palavra-chave selecionada para uma categoria.
   * @param category - A categoria da palavra-chave.
   * @param keyword - A palavra-chave selecionada.
   */
  const handleKeywordClick = (category: CategoryName, keyword: string) => {
    const newMap = new Map(selectedKeywords);
    
    // Se a palavra-chave já estiver selecionada, deseleciona. Caso contrário, seleciona.
    if (newMap.get(category) === keyword) {
      newMap.delete(category);
    } else {
      newMap.set(category, keyword);
    }
    setSelectedKeywords(newMap);
  };

  /**
   * Mapeia as palavras-chave selecionadas (que podem estar em PT) para o inglês
   * antes de enviar para a API de geração de imagem.
   * @returns Um array de palavras-chave em inglês.
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
   * Manipula a ação de gerar imagem.
   * Constrói o prompt, chama a server action e atualiza o estado com a imagem gerada.
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

        // Adiciona a nova imagem à galeria e mantém o limite.
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
   * Ativa o "Modo Caos", que seleciona palavras-chave aleatórias.
   * Chama uma server action para obter uma combinação aleatória e atualiza as seleções.
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
        
        // Função auxiliar para encontrar a chave de um objeto pelo seu valor (case-insensitive).
        const findKeyByValue = (obj: {[key: string]: string}, value: string) => {
            if (!value) return undefined;
            const V = value.toLowerCase().trim();
            for (const key in obj) {
              if(obj[key].toLowerCase().trim() === V) return key;
            }
            return undefined;
        }
        
        // Mapeia os resultados aleatórios em inglês de volta para o idioma atual da UI.
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
   * Limpa a imagem gerada para permitir uma nova seleção de palavras-chave.
   */
  const handleRemix = () => {
    setGeneratedImage(null);
    setCurrentPrompt('');
    setImageDialogOpen(false);
  };
  
  /**
   * Manipula o download da imagem gerada.
   */
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
      toast({
        title: T.toast.downloadFailed.title,
        description: T.toast.downloadFailed.description,
        variant: 'destructive'
      });
    }
  };

  /**
   * Abre a imagem da galeria em uma nova janela para melhor visualização.
   * @param imageUrl - A URL da imagem a ser aberta.
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
   * Manipula o compartilhamento da imagem usando a API Web Share.
   * Se a API não estiver disponível, faz o download da imagem como fallback.
   */
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
            // Fallback para download se a API de compartilhamento não estiver disponível.
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
   * Remove uma imagem da galeria.
   * @param id - O ID da imagem a ser removida.
   */
  const handleDeleteFromGallery = (id: string) => {
    setGalleryImages(prevImages => prevImages.filter(img => img.id !== id));
    toast({
        title: T.toast.deleteSuccess.title,
    })
  }

  /**
   * Copia a chave Pix para a área de transferência.
   */
  const handleCopyPixKey = () => {
    navigator.clipboard.writeText(T.donations.pixKey);
    toast({
      title: T.donations.toastCopied,
    });
  };

  /**
   * Alterna o idioma da interface e atualiza as palavras-chave selecionadas para o novo idioma.
   */
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'pt' : 'en';
    setLanguage(newLang);

    // Traduz as palavras-chave já selecionadas para o novo idioma.
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
   * Renderiza os botões de palavra-chave para uma determinada categoria.
   * @param category - A categoria para a qual renderizar os botões.
   * @returns Um array de elementos de botão.
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
   * Renderiza a seção completa de seleção de palavras-chave para uma categoria.
   * @param category - A categoria a ser renderizada.
   * @returns Um elemento JSX com o seletor de palavras-chave.
   */
  const renderKeywordSelector = (category: CategoryName) => (
      <div key={category}>
        <h2 className="text-3xl font-bold tracking-wider mb-4 md:hidden" style={{color: keywordCategories[category].color.replace(/bg-\[|\]/g, '')}}>{category.toUpperCase()}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderKeywordButtons(category)}
        </div>
      </div>
  );

  // JSX para a caixa que exibe o prompt atual.
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

  // JSX para o card que exibe o resultado da imagem gerada.
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

  // JSX para a seção da galeria de imagens.
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

    // JSX para a seção de doação.
    const donationSection = (
      <div className="mt-12">
        <Card className="shadow-lg border-2 border-border rounded-2xl bg-card text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-black">{T.donations.title}</CardTitle>
            <CardDescription className="font-body text-lg">{T.donations.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 p-6">
            {/* Seção PIX */}
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

            {/* Seção PayPal */}
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

  // JSX para os botões de ação principais (Gerar e Modo Caos).
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
        {/* Cabeçalho da página */}
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

        {/* Conteúdo principal da página com layout de duas colunas em desktop */}
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-8">
            <div className="text-center bg-muted p-4 rounded-xl border-2 border-border">
                <p className="font-body text-lg text-foreground">{T.instruction}</p>
            </div>

            {/* Layout para dispositivos móveis */}
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
            
            {/* Layout para desktop */}
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

          {/* Coluna da direita (resultados e ações em desktop) */}
          <div className="sticky top-8 space-y-8">
            {!isMobile && (
              <>
                {actionButtons}
                {promptBox}
              </>
            )}
            <div ref={imageAreaRef}>
              {/* Indicador de carregamento */}
              {isPending && !generatedImage && (
                <Card className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl shadow-inner bg-background/50 transition-all duration-300 border-4 border-dashed border-border aspect-square">
                    <Loader2 className="w-16 h-16 animate-spin text-primary" />
                    <p className="font-body text-accent text-lg">{T.status.forging}</p>
                    <p className="text-muted-foreground text-sm">{T.status.takeAMoment}</p>
                </Card>
              )}

              {/* Exibe o resultado da imagem no celular */}
              {!isPending && generatedImage && isMobile && imageResultCard}

            </div>
          </div>
        </main>

        {/* Diálogo para exibir a imagem gerada em tela cheia no desktop */}
        {!isMobile && (
            <Dialog open={isImageDialogOpen} onOpenChange={setImageDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader className="sr-only">
                  <DialogTitle>{T.imageCard.title}</DialogTitle>
                  <DialogDescription>{currentPrompt}</DialogDescription>
                </DialogHeader>
                {imageResultCard}
              </DialogContent>
            </Dialog>
        )}

        {/* Seção da galeria */}
        {gallerySection}

        {/* Seção de Doação */}
        {donationSection}

      </div>
    </TooltipProvider>
  );
}
