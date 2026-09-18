import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const CommunityContext = createContext(null);

const INITIAL_POSTS = [
  {
    id: "post-1",
    author: "Sarah M.",
    category: "Healthy Eating",
    title: "My easy high-protein breakfast",
    content:
      "Greek yoghurt, fresh berries and a small handful of almonds have become my favourite quick breakfast.",
    createdAt: "Today",
    likes: 18,
    comments: 4,
    liked: false,
  },
  {
    id: "post-2",
    author: "David K.",
    category: "Wellness",
    title: "Small changes made a big difference",
    content:
      "I started walking after dinner and drinking more water. These simple habits helped me feel more energetic.",
    createdAt: "Yesterday",
    likes: 25,
    comments: 7,
    liked: false,
  },
  {
    id: "post-3",
    author: "NutriHelp Team",
    category: "Community Tip",
    title: "Remember to check your weekly goals",
    content:
      "Review your nutrition and wellness goals regularly and celebrate every small improvement.",
    createdAt: "2 days ago",
    likes: 32,
    comments: 5,
    liked: false,
  },
];

const COMMUNITY_LEADERS = [
  {
    id: "leader-1",
    name: "Sarah M.",
    points: 1240,
    badge: "Nutrition Champion",
  },
  {
    id: "leader-2",
    name: "David K.",
    points: 1105,
    badge: "Wellness Supporter",
  },
  {
    id: "leader-3",
    name: "Priya S.",
    points: 980,
    badge: "Recipe Contributor",
  },
  {
    id: "leader-4",
    name: "Michael T.",
    points: 860,
    badge: "Active Member",
  },
];

export function CommunityProvider({ children }) {
  const [posts, setPosts] = useState(INITIAL_POSTS);

  const addPost = useCallback(({ title, content, category }) => {
    const newPost = {
      id: `post-${Date.now()}`,
      author: "You",
      category,
      title: title.trim(),
      content: content.trim(),
      createdAt: "Just now",
      likes: 0,
      comments: 0,
      liked: false,
    };

    setPosts((currentPosts) => [newPost, ...currentPosts]);

    return newPost;
  }, []);

  const toggleLike = useCallback((postId) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post.id !== postId) {
          return post;
        }

        const nextLiked = !post.liked;

        return {
          ...post,
          liked: nextLiked,
          likes: Math.max(
            0,
            post.likes + (nextLiked ? 1 : -1)
          ),
        };
      })
    );
  }, []);

  const getPostById = useCallback(
    (postId) => posts.find((post) => post.id === postId),
    [posts]
  );

  const value = useMemo(
    () => ({
      posts,
      leaders: COMMUNITY_LEADERS,
      addPost,
      toggleLike,
      getPostById,
    }),
    [posts, addPost, toggleLike, getPostById]
  );

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const context = useContext(CommunityContext);

  if (!context) {
    throw new Error(
      "useCommunity must be used inside CommunityProvider."
    );
  }

  return context;
}