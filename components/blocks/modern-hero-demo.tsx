import { Hero7 } from '@/components/ui/modern-hero';

const heroDemoData = {
  heading: 'Launch customer-ready analytics apps instantly',
  description:
    'Connect your Supabase project and let Dasor generate dashboards, workflows, and AI copilots tailored to your business data.',
  button: {
    text: 'Connect Supabase project',
    url: '/connect',
  },
  reviews: {
    count: 200,
    avatars: [
      {
        src: 'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?auto=format&fit=facearea&w=160&h=160&q=80',
        alt: 'Operations leader avatar',
      },
      {
        src: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=160&h=160&q=80',
        alt: 'Growth marketer avatar',
      },
      {
        src: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=facearea&w=160&h=160&q=80',
        alt: 'Product designer avatar',
      },
      {
        src: 'https://images.unsplash.com/photo-1506086679524-493c64fdfaa6?auto=format&fit=facearea&w=160&h=160&q=80',
        alt: 'Engineering lead avatar',
      },
      {
        src: 'https://images.unsplash.com/photo-1664575599736-3bef1cd00c8d?auto=format&fit=facearea&w=160&h=160&q=80',
        alt: 'Customer success avatar',
      },
    ],
  },
};

function Hero7Demo() {
  return <Hero7 {...heroDemoData} />;
}

export { Hero7Demo };


