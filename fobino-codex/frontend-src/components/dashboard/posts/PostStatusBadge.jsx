import { getPostStatusMeta } from '../../../utils/postDashboard';

export default function PostStatusBadge({ status }) {
  const meta = getPostStatusMeta(status);

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${meta.className}`}>
      {meta.label}
    </span>
  );
}