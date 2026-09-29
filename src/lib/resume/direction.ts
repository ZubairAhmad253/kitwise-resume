/**
 * Right-to-left support. A resume written mostly in Arabic (or another
 * right-to-left script) is laid out right to left and gets Arabic labels,
 * month names and section headings; the Design panel can force either
 * direction.
 */
import type { Basics, Resume, SectionKind } from './types';

/** Letters of right-to-left scripts: Hebrew, Arabic (with Urdu and Persian), Syriac, Thaana, N'Ko. */
const RTL_LETTER = /[֐-߿ࡠ-ࣿיִ-﷿ﹰ-﻿]/g;
const LTR_LETTER = /[A-Za-zÀ-ɏͰ-ϿЀ-ӿ]/g;

const count = (s: string, re: RegExp) => s.match(re)?.length ?? 0;

/** True when a text has more right-to-left letters than left-to-right ones. */
export function isRtlText(text: string): boolean {
  const rtl = count(text, RTL_LETTER);
  return rtl > 0 && rtl >= count(text, LTR_LETTER);
}

const basicsText = (b: Basics) => [b.name, b.headline, b.summary].join(' ');

/** Whether the personal details are written in a right-to-left language. */
export const isRtlBasics = (b: Basics) => isRtlText(basicsText(b));

const cache = new WeakMap<Resume, boolean>();

/** Whether the resume's text is mostly right-to-left (name, summary, headings and entry titles). */
export function isRtlContent(r: Resume): boolean {
  let v = cache.get(r);
  if (v === undefined) {
    const parts = [basicsText(r.basics)];
    for (const s of r.sections) parts.push(s.title, ...s.items.map((it) => `${it.title} ${it.subtitle}`));
    v = isRtlText(parts.join(' '));
    cache.set(r, v);
  }
  return v;
}

/** The direction a resume is laid out in: the user's choice, or from its text. */
export function resumeDir(r: Resume): 'ltr' | 'rtl' {
  const d = r.settings.direction;
  if (d === 'ltr' || d === 'rtl') return d;
  return isRtlContent(r) ? 'rtl' : 'ltr';
}

/** Labels templates print themselves, in Arabic. */
const AR: Record<string, string> = {
  Profile: 'نبذة',
  Summary: 'الملخص',
  Contact: 'التواصل',
  contact: 'التواصل',
  Email: 'البريد الإلكتروني',
  Phone: 'الهاتف',
  Location: 'الموقع',
  Website: 'الموقع الإلكتروني',
  LinkedIn: 'لينكدإن',
  GitHub: 'جيت هب',
  Registration: 'التسجيل المهني',
  Valid: 'صالحة',
  Public: 'عام',
  Role: 'الدور',
  Site: 'الموقع',
  Name: 'الاسم',
  Contents: 'المحتويات',
  'Curriculum Vitae': 'السيرة الذاتية',
  'Drawing title': 'عنوان اللوحة',
  Present: 'حتى الآن',
  Beginner: 'مبتدئ',
  Basic: 'أساسي',
  Good: 'جيد',
  'Very good': 'جيد جدًا',
  Expert: 'خبير',
};

/** A label in the resume's language (Arabic when its text is Arabic). */
export const label = (arabic: boolean, text: string) => (arabic ? (AR[text] ?? text) : text);

/** Arabic month names as used across the Arab world (Gregorian calendar). */
export const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

/** Arabic section headings, offered when the resume is in Arabic. */
export const AR_SECTION_TITLES: Record<SectionKind, string> = {
  experience: 'الخبرة العملية',
  education: 'التعليم',
  skills: 'المهارات',
  projects: 'المشاريع',
  certifications: 'الشهادات والرخص',
  languages: 'اللغات',
  awards: 'الجوائز',
  publications: 'المنشورات',
  volunteering: 'العمل التطوعي',
  references: 'المراجع',
  custom: 'قسم إضافي',
};
