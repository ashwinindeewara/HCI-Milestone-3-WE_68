export interface TalentProfile {
  id: string;
  name: string;
  verified: boolean;
  role: string;
  rating: number;
  jobsCount: number;
  hourlyRate: string;
  availability: string;
  skills: string[];
  bio: string;
  avatarUrl: string;
  portfolio: Array<{ title: string; imageUrl: string }>;
  review: { company: string; date: string; quote: string };
}

export const TALENT_PROFILES: TalentProfile[] = [
  {
    id: '1',
    name: 'Amaya Perera',
    verified: true,
    role: 'Senior UI/UX & Brand Designer',
    rating: 4.9,
    jobsCount: 18,
    hourlyRate: '$65/hr',
    availability: 'Available Now',
    skills: ['Figma', 'UI Design', 'UX Architecture', 'Prototyping', 'Design Systems', 'Mobile Design'],
    bio: 'Over 6 years of experience crafting high-converting mobile apps and enterprise SaaS portals. Expert in creating crisp interactive Figma prototypes and scalable design systems.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=320&q=85',
    portfolio: [
      {
        title: 'Analytics dashboard',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=720&q=85',
      },
      {
        title: 'Mobile commerce app',
        imageUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=720&q=85',
      },
    ],
    review: {
      company: 'Apex Softworks Inc.',
      date: 'Oct 2, 2024',
      quote: 'Amaya delivered an exceptional dashboard prototype ahead of schedule. She is professional, responsive and highly skilled.',
    },
  },
  {
    id: '2',
    name: 'Vihaga Edirisinghe',
    verified: true,
    role: 'Frontend Developer',
    rating: 4.9,
    jobsCount: 32,
    hourlyRate: '$80/hr',
    availability: 'Available Now',
    skills: ['React', 'TypeScript', 'React Native', 'Accessibility', 'CSS', 'Testing'],
    bio: 'Frontend engineer focused on accessible, fast product experiences. I build responsive applications with maintainable component systems and clear collaboration throughout delivery.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=85',
    portfolio: [
      {
        title: 'Product analytics',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=720&q=85',
      },
      {
        title: 'Responsive storefront',
        imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=720&q=85',
      },
    ],
    review: {
      company: 'Northstar Digital',
      date: 'Sep 18, 2024',
      quote: 'Vihaga delivered a polished, reliable implementation and communicated clearly at every milestone.',
    },
  },
  {
    id: '3',
    name: 'Piyumi Kavindya',
    verified: true,
    role: 'Product Designer',
    rating: 4.8,
    jobsCount: 15,
    hourlyRate: '$70/hr',
    availability: 'Available Now',
    skills: ['Product Strategy', 'Figma', 'UX Research', 'Wireframing', 'Prototyping', 'Mobile Design'],
    bio: 'Product designer who turns complex workflows into clear, useful experiences. I combine research, interaction design and prototyping to help teams ship with confidence.',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=85',
    portfolio: [
      {
        title: 'Finance product',
        imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=720&q=85',
      },
      {
        title: 'Research workspace',
        imageUrl: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=720&q=85',
      },
    ],
    review: {
      company: 'Fieldnote Labs',
      date: 'Aug 29, 2024',
      quote: 'Piyumi brought structure to a complicated product and gave our team a prototype we could act on immediately.',
    },
  },
];