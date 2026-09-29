/**
 * Example resumes, one per field, so nobody starts from a blank page.
 * All people, employers and contact details are fictional. Samples are
 * plain data run through normalizeResume, which adds ids and defaults.
 */
import { normalizeResume } from './normalize';
import type { Resume, SectionKind } from './types';

type RawItem = Partial<{ title: string; subtitle: string; location: string; start: string; end: string; current: boolean; url: string; description: string; tags: string[]; level: number }>;
const sec = (kind: SectionKind, items: RawItem[], title?: string) => ({ kind, title, items });

export interface Sample {
  id: string;
  label: string;
  field: string;
  build: () => Resume;
}

const make = (name: string, template: string, data: { basics: Record<string, string>; sections: ReturnType<typeof sec>[] }) => () =>
  normalizeResume({ name, basics: data.basics, sections: data.sections, settings: { template, paper: 'A4', dateFormat: 'MMM YYYY', showPhoto: true, fitOnePage: false } })!;

export const SAMPLES: Sample[] = [
  {
    id: 'software',
    label: 'Software engineer',
    field: 'Software & tech',
    build: make('Software engineer', 'code-block', {
      basics: {
        name: 'Aisha Rahman',
        headline: 'Senior Software Engineer',
        email: 'aisha.rahman@example.com',
        phone: '+974 5550 1234',
        location: 'Doha, Qatar',
        website: 'aisharahman.dev',
        linkedin: 'linkedin.com/in/aisharahman',
        github: 'github.com/aisharahman',
        summary:
          'Backend-focused engineer with **8 years** of experience building payment and logistics platforms used by millions. I design reliable distributed systems, mentor engineers and care about clear, well-tested code.',
      },
      sections: [
        sec('experience', [
          {
            title: 'Senior Software Engineer',
            subtitle: 'Gulfstream Payments',
            location: 'Doha, Qatar',
            start: '2021-03',
            current: true,
            description:
              '- Led the rebuild of the card-authorisation service in Go, cutting p99 latency from 420 ms to 95 ms\n- Designed an event-driven settlement pipeline on Kafka handling 12 million transactions a day\n- Introduced contract testing across 14 services, reducing production incidents by 38%\n- Mentor four engineers; two promoted to senior within 18 months',
          },
          {
            title: 'Software Engineer',
            subtitle: 'RouteWise Logistics',
            location: 'Dubai, UAE',
            start: '2018-01',
            end: '2021-02',
            description:
              '- Built the real-time fleet-tracking API (Node.js, PostgreSQL, Redis) serving 3,000 vehicles\n- Automated route optimisation, saving customers an average of 11% in fuel costs\n- Moved deployments to Kubernetes with blue-green releases and zero-downtime migrations',
          },
          {
            title: 'Junior Developer',
            subtitle: 'Brightline Studio',
            location: 'Amman, Jordan',
            start: '2016-06',
            end: '2017-12',
            description: '- Shipped e-commerce features for 20+ client sites in PHP and React\n- Wrote the team’s first automated test suite and CI pipeline',
          },
        ]),
        sec('skills', [
          { title: 'Languages', tags: ['Go', 'TypeScript', 'Python', 'SQL'] },
          { title: 'Platforms', tags: ['Kubernetes', 'AWS', 'Kafka', 'PostgreSQL', 'Redis'] },
          { title: 'Practices', tags: ['System design', 'TDD', 'Observability', 'Code review'] },
        ]),
        sec('projects', [
          {
            title: 'ledgerlite',
            subtitle: 'Open-source maintainer',
            url: 'github.com/aisharahman/ledgerlite',
            description: 'A double-entry accounting library for Go with 2.1k GitHub stars and 40 contributors.',
            tags: ['Go', 'SQLite'],
          },
        ]),
        sec('education', [{ title: 'BSc Computer Science', subtitle: 'University of Jordan', location: 'Amman', start: '2012', end: '2016', description: 'First-class honours' }]),
        sec('certifications', [{ title: 'AWS Certified Solutions Architect – Associate', subtitle: 'Amazon Web Services', start: '2022-05' }]),
        sec('languages', [
          { title: 'English', subtitle: 'Fluent', level: 5 },
          { title: 'Arabic', subtitle: 'Native', level: 5 },
        ]),
      ],
    }),
  },
  {
    id: 'fresher',
    label: 'Graduate / fresher',
    field: 'Startups & freshers',
    build: make('Graduate resume', 'startup', {
      basics: {
        name: 'Omar Haddad',
        headline: 'Computer Science Graduate · Full-stack Developer',
        email: 'omar.haddad@example.com',
        phone: '+974 5550 8899',
        location: 'Doha, Qatar',
        github: 'github.com/omarhaddad',
        linkedin: 'linkedin.com/in/omarhaddad',
        summary: 'Recent graduate who loves turning ideas into working products. Won two hackathons, built apps used by 5,000+ students, and ready to learn fast in a product team.',
      },
      sections: [
        sec('education', [{ title: 'BSc Computer Engineering', subtitle: 'Qatar University', location: 'Doha', start: '2021-09', end: '2025-06', description: 'GPA 3.7 / 4.0 · Dean’s list, 5 semesters' }]),
        sec('projects', [
          {
            title: 'CampusRide',
            subtitle: 'Team lead, 4 people',
            start: '2024-02',
            end: '2024-06',
            description: 'Ride-sharing app for students. **1st place**, QU Innovation Hackathon 2024. 5,200 sign-ups in the first term.',
            tags: ['React Native', 'Firebase', 'Maps API'],
          },
          { title: 'StudyBuddy', subtitle: 'Solo project', start: '2023-09', end: '2023-12', description: 'AI flashcard generator for lecture notes; 800 weekly users.', tags: ['Next.js', 'Python', 'OpenAI API'] },
        ]),
        sec('experience', [{ title: 'Software Engineering Intern', subtitle: 'Doha Tech Hub', location: 'Doha', start: '2024-06', end: '2024-08', description: '- Built an internal dashboard in React used by 3 teams\n- Wrote 60+ unit tests and fixed 25 bugs in the booking service' }]),
        sec('skills', [
          { title: 'Frontend', tags: ['React', 'TypeScript', 'Tailwind CSS'] },
          { title: 'Backend', tags: ['Node.js', 'Python', 'PostgreSQL'] },
          { title: 'Tools', tags: ['Git', 'Figma', 'Docker'] },
        ]),
        sec('awards', [{ title: '1st place, QU Innovation Hackathon', subtitle: 'Qatar University', start: '2024-04' }]),
        sec('languages', [
          { title: 'Arabic', subtitle: 'Native', level: 5 },
          { title: 'English', subtitle: 'Fluent', level: 4 },
        ]),
      ],
    }),
  },
  {
    id: 'mechanical',
    label: 'Mechanical engineer',
    field: 'Mechanical & electrical engineering',
    build: make('Mechanical engineer', 'tech-matrix', {
      basics: {
        name: 'Daniel Okafor',
        headline: 'Mechanical Engineer · HVAC & MEP Systems',
        email: 'daniel.okafor@example.com',
        phone: '+974 5550 4411',
        location: 'Lusail, Qatar',
        linkedin: 'linkedin.com/in/danielokafor',
        summary: 'Chartered mechanical engineer with 9 years designing and commissioning HVAC and MEP systems for towers, hospitals and stadiums. Strong in energy modelling and site coordination.',
      },
      sections: [
        sec('experience', [
          {
            title: 'Senior Mechanical Engineer',
            subtitle: 'Al Wakra Engineering Consultants',
            location: 'Doha, Qatar',
            start: '2020-02',
            current: true,
            description: '- Lead HVAC design for a 42-storey mixed-use tower (18,000 TR district cooling)\n- Cut chilled-water pump energy by 22% through variable-primary redesign\n- Coordinate MEP clash detection across 6 subcontractors in Revit and Navisworks',
          },
          { title: 'Mechanical Design Engineer', subtitle: 'Coolstream Systems', location: 'Lagos, Nigeria', start: '2016-01', end: '2020-01', description: '- Designed ventilation for 3 hospitals to ASHRAE 170\n- Commissioned 120 air-handling units, achieving 100% first-time pass' },
        ]),
        sec('skills', [
          { title: 'Design software', tags: ['AutoCAD', 'Revit MEP', 'HAP', 'IES VE'] },
          { title: 'Standards', tags: ['ASHRAE', 'SMACNA', 'NFPA', 'QCS 2014'] },
          { title: 'Commissioning', tags: ['TAB', 'BMS integration', 'Chillers', 'AHUs'] },
        ]),
        sec('education', [{ title: 'BEng Mechanical Engineering', subtitle: 'University of Lagos', start: '2010', end: '2015' }]),
        sec('certifications', [
          { title: 'Chartered Engineer (CEng)', subtitle: 'IMechE', start: '2021' },
          { title: 'LEED Green Associate', subtitle: 'USGBC', start: '2019' },
        ]),
      ],
    }),
  },
  {
    id: 'civil',
    label: 'Civil engineer',
    field: 'Civil engineering & construction',
    build: make('Civil engineer', 'infrastructure', {
      basics: {
        name: 'Priya Nair',
        headline: 'Structural Engineer · PE',
        email: 'priya.nair@example.com',
        phone: '+974 5550 7722',
        location: 'Doha, Qatar',
        linkedin: 'linkedin.com/in/priyanair',
        summary: 'Structural engineer with 11 years on bridges, metro stations and high-rise concrete structures worth over QAR 2.4 billion. Known for value engineering and safe, on-time delivery.',
      },
      sections: [
        sec('experience', [
          {
            title: 'Lead Structural Engineer',
            subtitle: 'Pearl Infrastructure Group',
            location: 'Doha, Qatar',
            start: '2019-05',
            current: true,
            description: '- Led design of a 1.2 km elevated metro viaduct delivered 6 weeks early\n- Value-engineered post-tensioned slabs, saving QAR 18 million\n- Managed a team of 9 engineers and drafters',
          },
          { title: 'Structural Engineer', subtitle: 'Kerala Build Consultants', location: 'Kochi, India', start: '2014-07', end: '2019-04', description: '- Designed 14 residential towers up to 30 storeys\n- Zero lost-time incidents across 3 years of site supervision' },
        ]),
        sec('projects', [
          { title: 'Lusail Metro Station L-4', subtitle: 'Structural design lead', start: '2020', end: '2022', description: 'Underground station, 38,000 m² GFA, QAR 640 million.' },
          { title: 'Corniche Pedestrian Bridge', subtitle: 'Design checker', start: '2021', end: '2021', description: '120 m steel cable-stayed span.' },
        ]),
        sec('skills', [
          { title: 'Analysis', tags: ['ETABS', 'SAP2000', 'SAFE', 'MIDAS Civil'] },
          { title: 'Codes', tags: ['ACI 318', 'Eurocode 2', 'BS 8110', 'QCS'] },
        ]),
        sec('education', [{ title: 'MTech Structural Engineering', subtitle: 'IIT Madras', start: '2012', end: '2014' }]),
        sec('certifications', [{ title: 'Professional Engineer (PE)', subtitle: 'Qatar MME', start: '2020' }]),
      ],
    }),
  },
  {
    id: 'doctor',
    label: 'Doctor / physician',
    field: 'Healthcare & medicine',
    build: make('Physician CV', 'academic-clinical', {
      basics: {
        name: 'Dr Sara Al-Mansoori',
        headline: 'Consultant, Internal Medicine',
        email: 'sara.almansoori@example.com',
        phone: '+974 5550 3030',
        location: 'Doha, Qatar',
        summary: 'Board-certified internist with 12 years of clinical practice and a special interest in diabetes and cardiometabolic care.',
      },
      sections: [
        sec('certifications', [
          { title: 'Medical licence (Consultant)', subtitle: 'Department of Healthcare Professions, Qatar', start: '2018', description: 'Licence no. DHP-12345' },
          { title: 'Arab Board of Internal Medicine', subtitle: 'Arab Board of Health Specializations', start: '2016' },
          { title: 'Advanced Cardiac Life Support (ACLS)', subtitle: 'American Heart Association', start: '2024', end: '2026' },
        ], 'Licences & board certification'),
        sec('experience', [
          {
            title: 'Consultant Physician, Internal Medicine',
            subtitle: 'Doha General Hospital',
            location: 'Doha, Qatar',
            start: '2018-09',
            current: true,
            description: '- Lead a 28-bed general medicine unit and a weekly diabetes clinic (60+ patients)\n- Reduced 30-day readmissions by 17% through a discharge-planning programme\n- Clinical supervisor for 12 internal-medicine residents',
          },
          { title: 'Specialist, Internal Medicine', subtitle: 'Al Khor Hospital', location: 'Al Khor, Qatar', start: '2016-07', end: '2018-08', description: '- Managed acute admissions and outpatient follow-up\n- Member of the antimicrobial stewardship committee' },
        ], 'Clinical experience'),
        sec('education', [
          { title: 'Residency, Internal Medicine', subtitle: 'Hamad Medical Training Programme', start: '2012', end: '2016' },
          { title: 'MBBS', subtitle: 'Weill Cornell Medicine – Qatar', start: '2006', end: '2012' },
        ]),
        sec('skills', [
          { title: 'Clinical', tags: ['Diabetes management', 'Cardiometabolic care', 'Acute medicine', 'Point-of-care ultrasound', 'Quality improvement'] },
        ], 'Clinical skills'),
        sec('publications', [
          { title: 'Early insulin titration in hospitalised patients with type 2 diabetes', subtitle: 'Gulf Journal of Medicine', start: '2022', description: 'Al-Mansoori S, Haddad R, Patel K.' },
        ]),
        sec('languages', [
          { title: 'Arabic', subtitle: 'Native', level: 5 },
          { title: 'English', subtitle: 'Fluent', level: 5 },
        ]),
      ],
    }),
  },
  {
    id: 'driver',
    label: 'Heavy vehicle driver',
    field: 'Logistics, drivers & aviation',
    build: make('Driver resume', 'credential-first', {
      basics: {
        name: 'Ramesh Kumar',
        headline: 'Heavy Vehicle Driver · Zero Accidents',
        email: 'ramesh.kumar@example.com',
        phone: '+974 5550 6060',
        location: 'Industrial Area, Doha',
        summary: 'Safety-first heavy vehicle driver working across the GCC since 2011. Experienced with trailers, tankers and construction equipment, with a perfect safety record and on-time delivery rate above 99%.',
      },
      sections: [
        sec('certifications', [
          { title: 'Qatar Heavy Vehicle Licence', subtitle: 'Ministry of Interior, Qatar', start: '2015', end: '2030', description: 'Licence no. 28512345' },
          { title: 'UAE Heavy Vehicle Licence', subtitle: 'RTA Dubai', start: '2011', end: '2027' },
          { title: 'Dangerous Goods (ADR) Certificate', subtitle: 'QatarEnergy approved', start: '2023', end: '2026' },
          { title: 'Medical fitness certificate', subtitle: 'Hamad Medical Corporation', start: '2025' },
        ], 'Licences & clearances'),
        sec('experience', [
          { title: 'Heavy Truck & Trailer Driver', subtitle: 'Desert Line Transport', location: 'Doha, Qatar', start: '2015-04', current: true, description: '- 480,000 km driven with zero accidents or violations\n- Deliver construction materials to 30+ sites; 99.4% on-time rate\n- Daily vehicle inspections and logbook reporting' },
          { title: 'Tanker Driver', subtitle: 'Emirates Fuel Logistics', location: 'Dubai, UAE', start: '2011-02', end: '2015-03', description: '- Transported fuel under ADR rules across the UAE and Oman' },
        ]),
        sec('skills', [
          { title: 'Vehicles', tags: ['Articulated trailers', 'Fuel tankers', 'Tipper trucks', 'Forklift'] },
          { title: 'Safety', tags: ['Defensive driving', 'Load securing', 'First aid'] },
        ]),
        sec('languages', [
          { title: 'Hindi', subtitle: 'Native', level: 5 },
          { title: 'English', subtitle: 'Good', level: 3 },
          { title: 'Arabic', subtitle: 'Basic', level: 2 },
        ]),
      ],
    }),
  },
  {
    id: 'designer',
    label: 'Designer',
    field: 'Creative, design & marketing',
    build: make('Designer resume', 'color-rail', {
      basics: {
        name: 'Lina Park',
        headline: 'Brand & Product Designer',
        email: 'lina.park@example.com',
        phone: '+974 5550 2525',
        location: 'Doha, Qatar',
        website: 'linapark.design',
        linkedin: 'linkedin.com/in/linapark',
        summary: 'Designer bridging brand and product for 7 years. I build visual identities and design systems that stay consistent from the logo to the checkout screen.',
      },
      sections: [
        sec('experience', [
          { title: 'Senior Product Designer', subtitle: 'Souq Digital', location: 'Doha, Qatar', start: '2022-01', current: true, description: '- Own the design system used by 40 designers and engineers\n- Redesigned checkout, lifting conversion by 14%' },
          { title: 'Brand Designer', subtitle: 'Northlight Agency', location: 'Seoul, South Korea', start: '2018-03', end: '2021-12', description: '- Delivered 25+ brand identities for tech and hospitality clients\n- Art-directed campaigns with a combined reach of 12 million' },
        ]),
        sec('projects', [
          { title: 'Souq Design System', subtitle: 'Lead designer', url: 'linapark.design/souq', description: '120 components, Arabic and English layouts, dark mode.', tags: ['Figma', 'Tokens'] },
          { title: 'Harbour Hotels rebrand', subtitle: 'Northlight Agency', description: 'New identity across 9 properties.', tags: ['Branding', 'Print'] },
        ], 'Selected work'),
        sec('skills', [
          { title: 'Figma', level: 5 },
          { title: 'Adobe Illustrator', level: 5 },
          { title: 'Prototyping', level: 4 },
          { title: 'Motion design', level: 3 },
        ]),
        sec('education', [{ title: 'BFA Visual Communication', subtitle: 'Hongik University', start: '2014', end: '2018' }]),
      ],
    }),
  },
  {
    id: 'finance',
    label: 'Finance manager',
    field: 'Corporate, finance & administration',
    build: make('Finance resume', 'executive-gold', {
      basics: {
        name: 'James Whitfield',
        headline: 'Finance Manager · ACCA',
        email: 'james.whitfield@example.com',
        phone: '+974 5550 9090',
        location: 'West Bay, Doha',
        linkedin: 'linkedin.com/in/jameswhitfield',
        summary: 'ACCA-qualified finance manager with 13 years in FP&A and financial control for real-estate and hospitality groups. Oversee budgets up to QAR 850 million and lead teams of 12.',
      },
      sections: [
        sec('experience', [
          { title: 'Finance Manager', subtitle: 'Marina Heights Real Estate', location: 'Doha, Qatar', start: '2019-01', current: true, description: '- Own the QAR 850 million annual budget and monthly board reporting\n- Cut month-end close from 12 to 5 working days\n- Led IFRS 16 adoption across 38 lease contracts' },
          { title: 'Senior Financial Analyst', subtitle: 'Crown Hospitality Group', location: 'London, UK', start: '2013-06', end: '2018-12', description: '- Built the forecasting model for 22 hotels\n- Identified GBP 2.3 million in annual procurement savings' },
        ]),
        sec('skills', [
          { title: 'Finance', tags: ['FP&A', 'IFRS', 'Consolidation', 'Treasury'] },
          { title: 'Systems', tags: ['SAP S/4HANA', 'Oracle NetSuite', 'Power BI', 'Excel (advanced)'] },
        ]),
        sec('education', [{ title: 'BSc Accounting & Finance', subtitle: 'University of Leeds', start: '2008', end: '2011' }]),
        sec('certifications', [{ title: 'ACCA', subtitle: 'Association of Chartered Certified Accountants', start: '2015' }]),
      ],
    }),
  },
  {
    id: 'academic',
    label: 'Researcher / academic',
    field: 'Academia, science & legal',
    build: make('Academic CV', 'curriculum-vitae', {
      basics: {
        name: 'Dr Elena Rossi',
        headline: 'Associate Professor of Environmental Chemistry',
        email: 'elena.rossi@example.com',
        phone: '+974 5550 1717',
        location: 'Education City, Doha',
        website: 'elenarossi.science',
        summary: 'Environmental chemist researching desalination brine and coastal water quality. 34 peer-reviewed papers, USD 4.2 million in grants and 9 PhD students supervised.',
      },
      sections: [
        sec('experience', [
          { title: 'Associate Professor', subtitle: 'Gulf Institute of Science', location: 'Doha, Qatar', start: '2020-09', current: true, description: '- Lead the Coastal Water Chemistry Lab (12 researchers)\n- Teach analytical chemistry to 150 students a year' },
          { title: 'Assistant Professor', subtitle: 'University of Bologna', location: 'Bologna, Italy', start: '2015-10', end: '2020-08' },
        ], 'Academic appointments'),
        sec('education', [
          { title: 'PhD Environmental Chemistry', subtitle: 'ETH Zurich', start: '2010', end: '2014', description: 'Thesis: Trace metals in hypersaline discharge plumes' },
          { title: 'MSc Chemistry', subtitle: 'University of Padua', start: '2008', end: '2010' },
        ]),
        sec('publications', [
          { title: 'Brine discharge and seagrass decline in the Arabian Gulf', subtitle: 'Environmental Science & Technology', start: '2024', description: 'Rossi E, Karim A, Müller T.' },
          { title: 'Microplastic transport in shallow coastal lagoons', subtitle: 'Marine Pollution Bulletin', start: '2023', description: 'Farouk N, Rossi E.' },
          { title: 'A low-cost sensor array for coastal salinity mapping', subtitle: 'Water Research', start: '2022', description: 'Rossi E, Haddad O.' },
          { title: 'Seasonal hypoxia in the western Arabian Gulf, 2015–2021', subtitle: 'Estuarine, Coastal and Shelf Science', start: '2022', description: 'Karim A, Rossi E, Al-Thani M.' },
          { title: 'Heavy metals in reclaimed coastal land: a ten-year record', subtitle: 'Science of the Total Environment', start: '2021', description: 'Rossi E, Bauer K, Farouk N.' },
          { title: 'Trace metal speciation in desalination effluents', subtitle: 'Chemosphere', start: '2019', description: 'Rossi E, Bauer K.' },
          { title: 'Antiscalant residues in reverse-osmosis brine', subtitle: 'Desalination', start: '2018', description: 'Rossi E, Conti L.' },
          { title: 'Hypersaline plume dilution models compared with field data', subtitle: 'Water Research', start: '2016', description: 'Rossi E, Müller T, Bauer K.' },
        ], 'Selected publications'),
        sec('custom', [
          { title: 'Analytical Chemistry (CHEM 310)', subtitle: 'Gulf Institute of Science', start: '2020', current: true, description: 'Lectures and lab design for 150 undergraduates a year; course rating 4.7 / 5.' },
          { title: 'Environmental Monitoring Methods (graduate)', subtitle: 'Gulf Institute of Science', start: '2021', current: true },
          { title: 'General Chemistry', subtitle: 'University of Bologna', start: '2015', end: '2020' },
        ], 'Teaching'),
        sec('custom', [
          { title: 'PhD students', subtitle: '3 graduated, 6 current', description: '- Nadia Farouk (2023): microplastics in coastal lagoons\n- Ahmed Karim (2022): seasonal hypoxia modelling\n- Luca Conti (2019): antiscalant fate in brine' },
          { title: 'MSc students', subtitle: '14 supervised since 2015' },
        ], 'Supervision'),
        sec('custom', [
          { title: 'Keynote: Desalination and the future of Gulf coastal waters', subtitle: 'International Water Conference, Abu Dhabi', start: '2024-02' },
          { title: 'Invited talk: Sensors for coastal salinity', subtitle: 'Goldschmidt Conference, Lyon', start: '2023-07' },
          { title: 'Plenary: Trace metals in hypersaline systems', subtitle: 'European Geosciences Union, Vienna', start: '2021-04' },
        ], 'Invited talks'),
        sec('awards', [
          { title: 'Early Career Research Award', subtitle: 'European Chemical Society', start: '2019' },
          { title: 'Research grant: Gulf Coastal Monitoring (USD 1.8M)', subtitle: 'National Research Fund', start: '2021' },
        ], 'Grants & awards'),
        sec('custom', [{ title: 'Journal reviewer', subtitle: 'Water Research; Marine Pollution Bulletin', start: '2016', current: true }], 'Service'),
      ],
    }),
  },
];

export const sampleById = (id: string) => SAMPLES.find((s) => s.id === id);
