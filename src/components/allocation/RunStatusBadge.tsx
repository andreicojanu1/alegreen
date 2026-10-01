import { Badge } from '../ui/Badge';
import { STATUS_META } from '../../lib/runLabels';
import type { RunStatus } from '../../data/types';

export function RunStatusBadge({ status }: { status: RunStatus }) {
  const m = STATUS_META[status];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}
