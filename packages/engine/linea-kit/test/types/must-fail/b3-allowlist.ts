import { applyMilestoneRules } from '@zeus/linea-kit/tools';
export const bad = applyMilestoneRules({ user: 'bob' }, { editorAllowlist: ['bob'] });
