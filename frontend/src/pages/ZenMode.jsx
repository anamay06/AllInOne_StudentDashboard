import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ZenMode() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-primary flex flex-col items-center justify-center relative p-10 z-[100]">
      <Button 
        variant="outline" 
        className="absolute top-10 left-10 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary z-50 h-auto py-3 px-6 rounded-xl border-2 shadow-none"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="mr-2" size={20} /> Exit Zen Mode
      </Button>
      
      <Card className="max-w-3xl w-full bg-background rounded-3xl border-4 border-foreground flex flex-col items-center justify-center p-12 shadow-[12px_12px_0px_var(--tw-shadow-color)] shadow-background mt-10">
        <CardContent className="text-center p-10">
          <h1 className="text-5xl font-black text-primary uppercase tracking-tighter mb-4">
            Zen Mode
          </h1>
          <p className="text-muted-foreground font-bold text-xl">
            Focus heavily. Distractions are disabled.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
