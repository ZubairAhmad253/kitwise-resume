/**
 * All templates. A resume stores only the template id, so templates can be
 * switched at any time; an unknown id falls back to the default.
 */
import { DEFAULT_TEMPLATE } from '@/lib/resume/defaults';
import { codeBlock } from './code-block';
import { corporate } from './corporate';
import { devRepo } from './dev-repo';
import { linearMono } from './linear-mono';
import { startup } from './startup';
import type { TemplateDef } from './types';

export const TEMPLATES: TemplateDef[] = [codeBlock, linearMono, devRepo, corporate, startup].sort((a, b) => a.number - b.number);

export const getTemplate = (id: string): TemplateDef => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE) ?? TEMPLATES[0];
