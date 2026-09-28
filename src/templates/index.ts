/**
 * All templates. A resume stores only the template id, so templates can be
 * switched at any time; an unknown id falls back to the default.
 */
import { DEFAULT_TEMPLATE } from '@/lib/resume/defaults';
import { blueprint } from './blueprint';
import { boldHeader } from './bold-header';
import { codeBlock } from './code-block';
import { corporate } from './corporate';
import { devRepo } from './dev-repo';
import { infrastructure } from './infrastructure';
import { linearMono } from './linear-mono';
import { startup } from './startup';
import { techMatrix } from './tech-matrix';
import { timeline } from './timeline';
import type { TemplateDef } from './types';

export const TEMPLATES: TemplateDef[] = [codeBlock, linearMono, devRepo, techMatrix, timeline, blueprint, infrastructure, boldHeader, corporate, startup].sort((a, b) => a.number - b.number);

export const getTemplate = (id: string): TemplateDef => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE) ?? TEMPLATES[0];
