'use client';

import Link from 'next/link';
import React from 'react';

import { Button } from '@/components/ui/button';

interface HeroButtonConfig {
  text: string;
  url: string;
}

interface Hero7Props {
  heading?: string;
  description?: string;
  button?: HeroButtonConfig;
  buttonComponent?: React.ReactNode;
}

const Hero7 = ({
  heading = 'Generate ChatApps from Your dataset',
  description = 'Connecting and analyzing your Supabase database by AI and instantly build your app.',
  button = {
    text: 'Connect Database to Start',
    url: '/connect',
  },
  buttonComponent,
}: Hero7Props) => {
  const renderButton = () => {
    if (buttonComponent) return buttonComponent;
    return (
      <Button asChild size="lg" className="mt-10 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
        <Link href={button.url}>{button.text}</Link>
      </Button>
    );
  };

  return (
    <section className="py-24 sm:py-32">
      <div className="container mx-auto px-4 text-center">
        <div className="mx-auto flex max-w-screen-lg flex-col gap-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {heading}
          </h1>
          <p className="flex items-center justify-center gap-2 text-balance text-base text-muted-foreground md:text-lg">
            <span>Connecting and analyzing your Datail</span>
            <img
              src="/supabase-logo.png"
              alt="Supabase logo"
              className="h-6 w-auto"
            />
            <span>Supabase database by AI and instantly build your app.</span>
          </p>
        </div>
        {renderButton()}
      </div>
    </section>
  );
};

export { Hero7 };


