import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <section className="text-center py-12 md:py-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">
          歡迎來到poker
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          透過互動教學、富挑戰性的情境模擬和 AI 驅動的策略建議，提升您的撲克技巧。
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link href="/tutorials">
              <Icons.BookOpen className="mr-2 h-5 w-5" /> 開始學習
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="text-lg px-8 py-6">
            <Link href="/scenarios">
              <Icons.Puzzle className="mr-2 h-5 w-5" /> 嘗試情境
            </Link>
          </Button>
        </div>
      </section>

      <section className="py-12 md:py-16 grid md:grid-cols-3 gap-8">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center text-primary mb-2">
              <Icons.BookOpen className="h-8 w-8 mr-3" />
              <CardTitle className="text-2xl">互動教學</CardTitle>
            </div>
            <CardDescription>
              透過引人入勝的課程，掌握德州撲克的基礎知識和進階概念。
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center text-primary mb-2">
              <Icons.Puzzle className="h-8 w-8 mr-3" />
              <CardTitle className="text-2xl">情境模擬</CardTitle>
            </div>
            <CardDescription>
              在真實的遊戲情境中測試您的決策能力，並獲得即時回饋。
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center text-primary mb-2">
              <Icons.Brain className="h-8 w-8 mr-3" />
              <CardTitle className="text-2xl">AI策略顧問</CardTitle>
            </div>
            <CardDescription>
              從我們的 AI 獲取個人化的策略建議，以改進您的打法。
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
