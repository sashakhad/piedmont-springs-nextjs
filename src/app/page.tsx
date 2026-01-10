import { AvailabilityView } from '@/components/AvailabilityView';

export default function Home() {
  return (
    <div className='min-h-screen bg-gradient-to-b from-stone-50 to-amber-50/30 dark:from-stone-950 dark:to-stone-900'>
      <div className='mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Header */}
        <header className='mb-8 text-center'>
          <h1 className='bg-gradient-to-r from-amber-700 via-amber-600 to-orange-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl dark:from-amber-400 dark:via-amber-300 dark:to-orange-400'>
            Piedmont Springs
          </h1>
          <p className='mt-2 text-lg text-stone-600 dark:text-stone-400'>
            Sauna, Steam & Hot Tub Availability
          </p>
        </header>

        {/* Main Content */}
        <main>
          <AvailabilityView />
        </main>
      </div>
    </div>
  );
}
