import React from 'react';
import AcademicsOverview from '@/components/academics/AcademicsOverview';

export default function Academics() {
  return (
    <div className="w-full h-full flex flex-col gap-6 pb-20 xl:pb-0 relative z-10">
      <Card className="flex-1 bg-card rounded-3xl border-[3px] border-primary flex flex-col items-center justify-center shadow-[8px_8px_0px_var(--tw-shadow-color)] shadow-primary min-h-[600px]">
        <CardContent className="p-12 text-center flex flex-col items-center justify-center h-full">
          <h1 className="text-5xl lg:text-8xl font-black text-primary opacity-20 uppercase tracking-tighter">
            Academics
          </h1>
          <p className="text-primary mt-4 font-bold text-2xl tracking-wide">
            Coming Soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
