
'use client'; 

import React, { useEffect, useState } from 'react';
import { mockLessons, BASIC_KNOWLEDGE_CHAPTER, CORE_STRATEGY_CHAPTER, ADVANCED_STRATEGY_CHAPTER, GAME_VARIANTS_AND_ADVANCED_CONCEPTS_CHAPTER } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Lock } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PlayingCard } from '@/components/ui/playing-card';
import { parseCard } from '@/lib/card-utils';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';


export default function LessonPage({ params }: { params: { lessonId: string } }) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const unwrappedParams = React.use(params); // Ensure params are resolved early
  const lesson = mockLessons.find(l => l.id === unwrappedParams.lessonId);

  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoadingCompletion, setIsLoadingCompletion] = useState(true);
  const [isUpdatingCompletion, setIsUpdatingCompletion] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false); // For content display
  const [isLoadingAuthorization, setIsLoadingAuthorization] = useState(true);

  useEffect(() => {
    if (authLoading || !lesson) return;

    const checkAuthorizationAndCompletion = async () => {
      setIsLoadingAuthorization(true);
      setIsLoadingCompletion(true);

      if (!user) {
        // User not logged in
        if (lesson.chapter === CORE_STRATEGY_CHAPTER || lesson.chapter === ADVANCED_STRATEGY_CHAPTER || lesson.chapter === GAME_VARIANTS_AND_ADVANCED_CONCEPTS_CHAPTER) {
          toast({ title: "訪問受限", description: "請先登入並完成基礎知識課程。", variant: "destructive" });
          router.push('/tutorials');
          return;
        }
        setIsAuthorized(true); // Basic lessons are accessible without login for viewing
        setIsLoadingAuthorization(false);
        setIsLoadingCompletion(false);
        return;
      }

      // User is logged in, fetch their progress
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        let userCompletedLessons: Record<string, boolean> = {};

        if (userDocSnap.exists()) {
          userCompletedLessons = userDocSnap.data()?.completedLessons || {};
        }
        
        setIsCompleted(!!userCompletedLessons[lesson.id]);

        // Authorization check
        if (lesson.chapter === CORE_STRATEGY_CHAPTER || lesson.chapter === ADVANCED_STRATEGY_CHAPTER || lesson.chapter === GAME_VARIANTS_AND_ADVANCED_CONCEPTS_CHAPTER) {
          const basicLessons = mockLessons.filter(l => l.chapter === BASIC_KNOWLEDGE_CHAPTER);
          const allBasicDone = basicLessons.every(l => !!userCompletedLessons[l.id]); // Use !! to ensure boolean conversion
          if (!allBasicDone) {
            toast({ title: "訪問受限", description: `請先完成所有「${BASIC_KNOWLEDGE_CHAPTER}」課程才能訪問此教學。`, variant: "destructive" });
            router.push('/tutorials');
            return;
          }
        }
        setIsAuthorized(true);
      } catch (error) {
        console.error("Error fetching user progress:", error);
        toast({ title: "錯誤", description: "無法讀取用戶進度。", variant: "destructive" });
        // Allow access to basic lessons even if progress fetch fails, but restrict advanced ones
        if (lesson.chapter !== BASIC_KNOWLEDGE_CHAPTER) {
            router.push('/tutorials');
            return;
        }
         setIsAuthorized(true); // Fallback for basic lessons
      } finally {
        setIsLoadingAuthorization(false);
        setIsLoadingCompletion(false);
      }
    };

    checkAuthorizationAndCompletion();
  }, [user, authLoading, lesson, unwrappedParams.lessonId, router, toast]);


  const handleMarkAsCompleted = async () => {
    if (!user || !lesson || isCompleted) return;
    setIsUpdatingCompletion(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const currentCompletedLessons = userDocSnap.data().completedLessons || {};
        await updateDoc(userDocRef, {
          completedLessons: {
            ...currentCompletedLessons,
            [lesson.id]: true,
          }
        });
      } else {
        // This case should ideally be handled by ensuring user doc exists upon registration
        await setDoc(userDocRef, {
          email: user.email, // Or however you store email
          scenariosCompleted: 0,
          completedLessons: { [lesson.id]: true },
          createdAt: new Date().toISOString(),
        }, { merge: true });
      }
      setIsCompleted(true);
      toast({ title: "課程已完成", description: `「${lesson.title}」已標記為已完成。` });
      router.push('/tutorials'); // Redirect after marking as complete
    } catch (error) {
      console.error("將課程標記為已完成時出錯:", error);
      toast({ title: "錯誤", description: "無法將課程標記為已完成。", variant: "destructive" });
    } finally {
      setIsUpdatingCompletion(false);
    }
  };

  const renderContent = (content: string) => {
    const paragraphs = content.split('\n\n');
    
    return paragraphs.map((paragraph, paraIndex) => {
      if (paragraph.startsWith('# ')) {
        return <h1 key={paraIndex} className="text-3xl font-bold mt-6 mb-3 text-primary">{paragraph.substring(2)}</h1>;
      }
      if (paragraph.startsWith('## ')) {
        return <h2 key={paraIndex} className="text-2xl font-semibold mt-5 mb-2">{paragraph.substring(3)}</h2>;
      }
      if (paragraph.startsWith('### ')) {
        return <h3 key={paraIndex} className="text-xl font-semibold mt-4 mb-1">{paragraph.substring(4)}</h3>;
      }
      if (paragraph.startsWith('#### ')) {
        return <h4 key={paraIndex} className="text-lg font-semibold mt-3 mb-1">{paragraph.substring(5)}</h4>;
      }

      if (paragraph.match(/^(\s*(\*|-|\d+\.)\s+.*)(\n\s*(\*|-|\d+\.)\s+.*)*/)) {
        const listItems = paragraph.split('\n').map(line => line.trim());
        const listType = listItems[0].startsWith('*') || listItems[0].startsWith('-') ? 'ul' : 'ol';
        
        const ListElement = listType as keyof JSX.IntrinsicElements;

        return (
          <ListElement key={paraIndex} className={`mb-4 pl-6 ${listType === 'ul' ? 'list-disc' : 'list-decimal'} text-foreground/90`}>
            {listItems.map((itemText, itemIndex) => {
              const actualText = itemText.replace(/^(\*|-|\d+\.)\s+/, '');
               const cardPattern = /(\b[AKQJ1098765432][shdc]\b)/g; 
               const textParts = actualText.split(cardPattern);
               const processedParts = textParts.filter(part => part.length > 0);

              return (
                <li key={itemIndex} className="mb-1">
                  {processedParts.map((part, partIndex) => {
                    if (part.match(/^\b[AKQJ1098765432][shdc]\b$/)) { 
                      const parsedCard = parseCard(part);
                      if (parsedCard) {
                        return (
                          <span key={partIndex} className="inline-block align-middle mx-0.5">
                            <PlayingCard card={parsedCard} size="xs" />
                          </span>
                        );
                      }
                    }
                    return <React.Fragment key={partIndex}>{part}</React.Fragment>;
                  })}
                </li>
              );
            })}
          </ListElement>
        );
      }
      
      const cardPattern = /(\b[AKQJ1098765432][shdc]\b)/g; 
      const textParts = paragraph.split(cardPattern);
      const processedParts = textParts.filter(part => part.length > 0);

      return (
        <div key={paraIndex} className="mb-4 leading-relaxed text-foreground/90">
          {processedParts.map((part, partIndex) => {
            if (part.match(/^\b[AKQJ1098765432][shdc]\b$/)) {  
              const parsedCard = parseCard(part);
              if (parsedCard) {
                return (
                  <span key={partIndex} className="inline-block align-middle mx-0.5"> 
                    <PlayingCard card={parsedCard} size="xs" />
                  </span>
                );
              }
            }
            const sequenceMatch = part.match(/^\(\s*([AKQJ1098765432][shdc](?:\s[AKQJ1098765432][shdc])*)\s*\)$/); 
            if (sequenceMatch) {
              const cardStrings = sequenceMatch[1].split(/\s+/);
              return (
                <span key={partIndex} className="inline-flex space-x-1 mx-1 align-middle">
                  {cardStrings.map((cs, csIndex) => {
                    const parsedCard = parseCard(cs);
                    return parsedCard ? <PlayingCard key={csIndex} card={parsedCard} size="xs" /> : null;
                  })}
                </span>
              );
            }
            return <React.Fragment key={partIndex}>{part}</React.Fragment>; 
          })}
        </div>
      );
    });
  };

  if (authLoading || isLoadingAuthorization || !lesson) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <Icons.Loader className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">正在載入教學...</p>
      </div>
    );
  }

  if (!isAuthorized && !authLoading && !isLoadingAuthorization) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-semibold">訪問受限</h1>
        <p className="text-muted-foreground my-4">您需要先完成基礎課程才能查看此教學。</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/tutorials">
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回教學列表
          </Link>
        </Button>
      </div>
    );
  }
  
  if (!lesson) { 
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-semibold">課程未找到</h1>
        <Button asChild variant="link" className="mt-4">
          <Link href="/tutorials">
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回教學列表
          </Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm" className="mb-6">
        <Link href="/tutorials">
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回教學列表
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl text-primary">{lesson.title}</CardTitle>
          <p className="text-sm text-muted-foreground">章節: {lesson.chapter}</p>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 prose prose-invert max-w-none">
          <div className="prose dark:prose-invert max-w-full">
            {renderContent(lesson.content)}
          </div>
        </CardContent>
      </Card>

      {user && (
        <div className="mt-8 text-center">
          <Button 
            onClick={handleMarkAsCompleted}
            disabled={isCompleted || isUpdatingCompletion || isLoadingCompletion}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 text-base"
          >
            {isUpdatingCompletion ? <Icons.Loader className="mr-2 h-4 w-4 animate-spin" /> : 
             isCompleted ? <CheckCircle className="mr-2 h-5 w-5" /> : null}
            {isCompleted ? '已完成此課程' : '標記為已完成'}
          </Button>
        </div>
      )}
    </div>
  );
}
