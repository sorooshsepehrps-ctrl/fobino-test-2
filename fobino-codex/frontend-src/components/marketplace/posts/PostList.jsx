import SellPostCard from './SellPostCard';
import BuyPostCard from './BuyPostCard';

export default function PostList({ posts = [], type = 'sell', onContactClick }) {
  if (!posts.length) return null;

  return (
    <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
      {posts.map((post) =>
        type === 'buy' ? (
          <BuyPostCard key={post._id} post={post} onContactClick={onContactClick} />
        ) : (
          <SellPostCard key={post._id} post={post} onContactClick={onContactClick} />
        )
      )}
    </div>
  );
}