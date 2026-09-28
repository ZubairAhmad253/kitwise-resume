/**
 * Ready-made wording to start from. Square brackets mark the parts to
 * replace with the user's own facts ("[X]%"); the resume check flags any
 * that are left in.
 */
import type { Resume } from '../types';

export interface PhraseField {
  id: string;
  label: string;
  /** Words in a headline or job title that suggest this field. */
  hints: RegExp;
  bullets: string[];
  summaries: string[];
}

export const PHRASE_FIELDS: PhraseField[] = [
  {
    id: 'software',
    label: 'Software & IT',
    hints: /software|developer|engineer.*(web|software|backend|frontend|full|data|cloud|devops)|programmer|devops|data (scientist|analyst|engineer)|it |sysadmin|qa |tester|cloud|cyber|security analyst/i,
    bullets: [
      'Built [feature or system] in [technology], used by [N] users a month',
      'Cut page load time by [X]% by [caching, code splitting, query tuning]',
      'Reduced production incidents by [X]% by adding automated tests and monitoring',
      'Designed and shipped a REST/GraphQL API serving [N] requests a day',
      'Migrated [service] to [cloud platform], lowering hosting costs by [X]%',
      'Automated [manual process], saving the team [N] hours a week',
      'Led code reviews for a team of [N] and set up the CI/CD pipeline',
      'Mentored [N] junior developers through onboarding and first releases',
      'Worked with product and design to launch [feature], lifting [metric] by [X]%',
      'Fixed [N] high-priority bugs and cut the support backlog by [X]%',
      'Wrote technical documentation that halved onboarding time for new engineers',
      'Improved data pipeline reliability to [99.9]% uptime',
    ],
    summaries: [
      '[Role] with [N] years of experience building [type of products] in [main technologies]. I care about reliable, well-tested code and shipping features users love.',
      'Software engineer who turns complex problems into simple, fast products. Experienced in [stack], [cloud], and leading small teams from idea to launch.',
    ],
  },
  {
    id: 'engineering',
    label: 'Engineering (mechanical, electrical, civil)',
    hints: /mechanical|electrical|civil|structural|mep|hvac|engineer|site|construction|project engineer|maintenance/i,
    bullets: [
      'Designed [system or structure] to [standard], delivered [N] weeks ahead of schedule',
      'Value-engineered [component], saving [currency] [amount] without affecting performance',
      'Led site inspections and quality checks across [N] projects with zero safety incidents',
      'Coordinated [N] subcontractors and resolved design clashes in [Revit, Navisworks]',
      'Commissioned [N] [units or systems], achieving a [X]% first-time pass rate',
      'Prepared calculations, drawings and specifications for [project] worth [value]',
      'Cut energy use by [X]% through [redesign, controls, retrofit]',
      'Managed maintenance for [equipment], raising uptime from [X]% to [Y]%',
      'Reviewed shop drawings and method statements for [N] packages',
      'Trained [N] technicians on new equipment and safety procedures',
    ],
    summaries: [
      '[Discipline] engineer with [N] years on [type of projects], from design through commissioning. Known for safe, on-time delivery and practical value engineering.',
      'Chartered [discipline] engineer experienced in [software] and [codes], leading design and site coordination on projects up to [value].',
    ],
  },
  {
    id: 'healthcare',
    label: 'Healthcare & nursing',
    hints: /nurse|doctor|physician|medical|clinical|health|pharmac|dentist|therap|paramedic|caregiver|midwife|radiograph|lab tech/i,
    bullets: [
      'Provided care for [N] patients per shift in a [N]-bed [unit]',
      'Reduced [readmissions, falls, waiting times] by [X]% through [initiative]',
      'Led a team of [N] nurses and allocated staff across shifts',
      'Trained [N] new staff on [procedure, system, protocol]',
      'Maintained accurate records in [Cerner, Epic] with [100]% audit compliance',
      'Took part in [quality improvement, infection control] committee',
      'Supported [N] procedures a week in [theatre, clinic, ICU]',
      'Educated patients and families on [condition, medication, discharge plans]',
      'Responded to emergencies and assisted in resuscitation as a certified [BLS, ACLS] provider',
    ],
    summaries: [
      'Registered [nurse, clinician] with [N] years in [specialty]. Calm under pressure, focused on patient safety and clear communication with families and teams.',
      '[Specialty] [physician, practitioner] with experience in [settings], teaching junior staff and leading quality-improvement projects.',
    ],
  },
  {
    id: 'logistics',
    label: 'Logistics, driving & warehouse',
    hints: /driver|logistic|warehouse|delivery|fleet|dispatch|supply chain|forklift|transport|courier|storekeeper|inventory|pilot|aviation/i,
    bullets: [
      'Drove [N] km with zero accidents or traffic violations',
      'Delivered to [N] sites a day with a [X]% on-time rate',
      'Carried out daily vehicle checks and kept logbooks up to date',
      'Loaded and secured [cargo type] to [ADR, company] safety standards',
      'Picked and packed [N] orders a shift with [X]% accuracy',
      'Cut stock discrepancies by [X]% through regular cycle counts',
      'Planned routes that reduced fuel costs by [X]%',
      'Trained [N] new drivers or warehouse staff on safety procedures',
      'Handled customer deliveries and paperwork, including cash on delivery',
    ],
    summaries: [
      'Safety-first [driver, warehouse operative] with [N] years across [region]. Licensed for [vehicle classes] with a clean record and a strong on-time delivery rate.',
      'Logistics professional experienced in [warehouse, fleet, dispatch] operations, inventory control and keeping deliveries on schedule.',
    ],
  },
  {
    id: 'sales',
    label: 'Sales & marketing',
    hints: /sales|marketing|account|business development|brand|seo|social media|growth|campaign|retail sales|real estate agent/i,
    bullets: [
      'Exceeded sales target by [X]%, generating [currency] [amount] in [year]',
      'Won [N] new accounts, including [notable client]',
      'Grew social media following from [N] to [N] in [months]',
      'Ran [N] campaigns with an average return on ad spend of [X]x',
      'Raised website conversion rate from [X]% to [Y]% through [A/B tests, landing pages]',
      'Built a pipeline of [N] qualified leads a month',
      'Kept a [X]% customer retention rate across a portfolio of [N] clients',
      'Launched [product] in [market], reaching [N] customers in the first [period]',
      'Produced content that drove [N] visits a month from search',
    ],
    summaries: [
      '[Role] with [N] years in [industry], consistently above target. I build lasting client relationships and turn data into campaigns that sell.',
      'Results-driven marketer experienced in [channels], with a track record of growing [metric] by [X]% for [type of brands].',
    ],
  },
  {
    id: 'finance',
    label: 'Finance & accounting',
    hints: /financ|account|audit|tax|payroll|bookkeep|controller|treasury|banking|analyst|cfa|acca|cpa/i,
    bullets: [
      'Prepared monthly management accounts and board reports for [N] entities',
      'Cut month-end close from [N] to [N] working days',
      'Managed a budget of [currency] [amount] and reported variances to leadership',
      'Found [currency] [amount] in savings through [procurement, process, contract] review',
      'Led [IFRS, tax, audit] compliance with no material findings',
      'Built forecasting models in [Excel, Power BI] used for [purpose]',
      'Reconciled [N] accounts a month and cleared a backlog of [N] items',
      'Automated [report, process] in [tool], saving [N] hours a month',
    ],
    summaries: [
      '[Qualification]-qualified [role] with [N] years in [industry]. Strong in reporting, forecasting and controls, and in explaining numbers clearly to non-finance teams.',
    ],
  },
  {
    id: 'admin',
    label: 'Admin & customer service',
    hints: /admin|assistant|secretary|reception|office|customer service|call center|support|coordinator|clerk|data entry|hr /i,
    bullets: [
      'Handled [N] calls and emails a day with a [X]% customer satisfaction score',
      'Managed calendars, travel and meetings for [N] senior managers',
      'Resolved [X]% of customer issues at first contact',
      'Organised filing and records, cutting document search time by [X]%',
      'Processed [N] invoices, orders or applications a week without errors',
      'Coordinated [events, onboarding, office moves] for [N] staff',
      'Trained [N] new team members on systems and procedures',
      'Kept stock of office supplies and cut spending by [X]%',
    ],
    summaries: [
      'Organised and friendly [role] with [N] years supporting busy teams. Skilled in [systems] and keeping things running smoothly behind the scenes.',
    ],
  },
  {
    id: 'education',
    label: 'Teaching & academia',
    hints: /teacher|lecturer|professor|tutor|research|academic|phd|school|education|instructor|trainer/i,
    bullets: [
      'Taught [subject] to [N] students a year, with [X]% passing [exam]',
      'Designed a new [course, curriculum] adopted across [N] classes',
      'Raised average grades from [X] to [Y] through [method]',
      'Supervised [N] student projects or theses',
      'Published [N] papers in [journals], cited [N] times',
      'Won [currency] [amount] in research funding from [funder]',
      'Organised [event, trip, club] for [N] students',
      'Mentored new teachers and led department training sessions',
    ],
    summaries: [
      '[Subject] [teacher, lecturer] with [N] years at [level]. I make lessons clear and engaging, and track progress so every student moves forward.',
      '[Field] researcher with [N] peer-reviewed publications and [currency] [amount] in grants, focused on [research area].',
    ],
  },
  {
    id: 'hospitality',
    label: 'Hospitality & retail',
    hints: /hotel|restaurant|chef|cook|waiter|barista|hospitality|retail|store|cashier|front desk|housekeeping|guest/i,
    bullets: [
      'Served [N] guests a shift with a [X]% satisfaction score',
      'Kept a [X]% rating on [review site] through consistent service',
      'Handled cash and card payments with zero discrepancies over [period]',
      'Upsold [products, rooms, menu items], raising average spend by [X]%',
      'Trained [N] new staff on service standards and food safety',
      'Managed stock and orders, cutting waste by [X]%',
      'Resolved guest complaints calmly and turned them into return visits',
    ],
    summaries: ['Guest-focused [role] with [N] years in [hotels, restaurants, retail]. Quick, friendly and reliable during the busiest shifts.'],
  },
  {
    id: 'creative',
    label: 'Design & creative',
    hints: /design|creative|artist|illustrat|photograph|video|ux|ui|animator|copywriter|writer|editor|architect/i,
    bullets: [
      'Designed [N] brand identities for clients in [industries]',
      'Redesigned [product, flow], lifting [conversion, engagement] by [X]%',
      'Built and maintained a design system used by [N] designers and engineers',
      'Ran user research with [N] participants and turned findings into [changes]',
      'Art-directed campaigns with a combined reach of [N] people',
      'Delivered [N] projects on time and within budget',
      'Won [award] for [project]',
    ],
    summaries: ['[Role] with [N] years creating [type of work] for [clients, products]. I combine strong visual craft with research to design work that performs.'],
  },
  {
    id: 'management',
    label: 'Management & leadership',
    hints: /manager|director|head of|lead|supervisor|chief|ceo|coo|founder|owner|operations/i,
    bullets: [
      'Led a team of [N] across [N] locations, meeting targets [N] quarters in a row',
      'Grew revenue from [amount] to [amount] in [period]',
      'Cut operating costs by [X]% through [process changes, renegotiated contracts]',
      'Hired and developed [N] people; [N] were promoted',
      'Launched [product, service, office] in [market]',
      'Set up KPIs and reporting that gave leadership a weekly view of [area]',
      'Raised employee engagement score from [X] to [Y]',
    ],
    summaries: ['[Role] with [N] years leading [teams, operations] in [industry]. I build strong teams, clear processes and steady growth.'],
  },
  {
    id: 'student',
    label: 'Students & first jobs',
    hints: /\b(?:student|graduate|intern|internship|fresher|trainee|entry[ -]level|apprentice)\b/i,
    bullets: [
      'Built [project] with a team of [N], used by [N] students',
      'Won [place] at [competition or hackathon]',
      'Completed a [N]-week internship at [company], working on [task]',
      'Led [club or society] of [N] members and organised [N] events',
      'Kept a [GPA or grade] while working [N] hours a week',
      'Volunteered [N] hours with [organisation], helping [who]',
      'Taught myself [skill] and used it to [result]',
    ],
    summaries: ['Recent [degree] graduate from [university] with hands-on experience in [skills] through [projects, internships]. Quick to learn and keen to grow in a [type of team].'],
  },
];

/** The field that best matches a resume's headline and job titles, for the default in the picker. */
export function guessField(r: Resume): string {
  const text = [r.basics.headline, ...r.sections.filter((s) => s.kind === 'experience').flatMap((s) => s.items.map((i) => i.title))].join(' ');
  // Students and graduates first: "Computer Science Graduate" wants first-job ideas more than senior ones.
  const student = PHRASE_FIELDS.find((f) => f.id === 'student')!;
  if (student.hints.test(r.basics.headline)) return 'student';
  return PHRASE_FIELDS.find((f) => f.hints.test(text))?.id ?? 'management';
}

/** Strong verbs to start bullets with; also used by the resume check. */
export const ACTION_VERBS = [
  'achieved', 'added', 'administered', 'advised', 'analysed', 'analyzed', 'applied', 'arranged', 'assembled', 'assessed', 'assisted', 'audited', 'automated', 'balanced', 'boosted', 'briefed', 'built', 'calculated', 'captured', 'cared', 'carried', 'championed', 'checked', 'cleared', 'closed', 'coached', 'collaborated', 'commissioned', 'completed', 'conducted', 'configured', 'consolidated', 'constructed', 'consulted', 'contributed', 'controlled', 'converted', 'coordinated', 'created', 'cut', 'debugged', 'decreased', 'defined', 'delivered', 'deployed', 'designed', 'developed', 'devised', 'diagnosed', 'directed', 'doubled', 'drafted', 'drove', 'earned', 'edited', 'educated', 'eliminated', 'enabled', 'engineered', 'enhanced', 'ensured', 'established', 'evaluated', 'examined', 'exceeded', 'executed', 'expanded', 'facilitated', 'fixed', 'forecast', 'formed', 'founded', 'generated', 'grew', 'guided', 'halved', 'handled', 'headed', 'helped', 'hired', 'identified', 'implemented', 'improved', 'increased', 'initiated', 'inspected', 'installed', 'instructed', 'integrated', 'introduced', 'investigated', 'kept', 'launched', 'led', 'lifted', 'loaded', 'lowered', 'maintained', 'managed', 'mapped', 'maximised', 'maximized', 'mentored', 'merged', 'migrated', 'minimised', 'minimized', 'modelled', 'modeled', 'monitored', 'motivated', 'negotiated', 'onboarded', 'opened', 'operated', 'optimised', 'optimized', 'orchestrated', 'organised', 'organized', 'overhauled', 'oversaw', 'owned', 'performed', 'piloted', 'pioneered', 'planned', 'prepared', 'presented', 'prevented', 'processed', 'produced', 'programmed', 'promoted', 'proposed', 'provided', 'published', 'raised', 'ran', 'rebuilt', 'recruited', 'redesigned', 'reduced', 'refactored', 'reorganised', 'reorganized', 'repaired', 'replaced', 'reported', 'researched', 'resolved', 'responded', 'restructured', 'reviewed', 'revised', 'saved', 'scaled', 'scheduled', 'secured', 'served', 'set', 'shipped', 'simplified', 'sold', 'solved', 'spearheaded', 'standardised', 'standardized', 'streamlined', 'strengthened', 'structured', 'supervised', 'supported', 'surveyed', 'taught', 'tested', 'tracked', 'trained', 'transformed', 'translated', 'tripled', 'troubleshot', 'turned', 'unified', 'upgraded', 'used', 'validated', 'verified', 'won', 'wrote',
];
