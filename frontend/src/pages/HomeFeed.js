import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const HomeFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Memoized fetch function
  const fetchFeed = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/feed', {
        params: { page: pageNum }
      });
      
      if (pageNum === 1) {
        setPosts(response.data.posts);
      } else {
        setPosts(prev => [...prev, ...response.data.posts]);
      }
      
      setHasMore(response.data.pagination?.hasMore || false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(1);
  }, [fetchFeed]);

  const handleLike = useCallback(async (postId, isLiked) => {
    try {
      if (isLiked) {
        await axios.post(`http://localhost:5000/api/posts/${postId}/unlike`);
      } else {
        await axios.post(`http://localhost:5000/api/posts/${postId}/like`);
      }
      // Update local state instead of refetching entire feed
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, isLiked: !isLiked, likesCount: isLiked ? post.likesCount - 1 : post.likesCount + 1 }
          : post
      ));
    } catch (err) {
      console.error('Like/unlike error:', err);
    }
  }, []);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(nextPage);
  }, [page, fetchFeed]);

  const formatTime = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'just now';
  }, []);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (posts.length === 0 && !loading) {
    return (
      <div className="empty-state">
        <h2>No posts yet</h2>
        <p>Follow some users to see their posts in your feed!</p>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id} className="card">
          <div className="card-header">
            <div className="card-header-avatar">
              {post.username ? post.username.charAt(0).toUpperCase() : '?'}
            </div>
            <Link
              to={`/profile/${post.user_id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <h3>{post.username}</h3>
            </Link>
          </div>
          <img 
            src={post.image_url?.startsWith('/') ? `http://localhost:5000${post.image_url}` : post.image_url} 
            alt={post.caption} 
            className="card-image" 
            loading="lazy"
          />
          <div className="card-content">
            <div className="card-actions">
              <button
                className={`card-action-button ${post.isLiked ? 'liked' : ''}`}
                onClick={() => handleLike(post.id, post.isLiked)}
              >
                {post.isLiked ? (
                  <svg aria-label="Unlike" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09[...]"/>
                  </svg>
                ) : (
                  <svg aria-label="Like" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.792 3.904A4.989 4.989 0 0121.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167[...]"/>
                  </svg>
                )}
              </button>
              <Link to={`/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <button className="card-action-button">
                  <svg aria-label="Comment" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.656 17.008a9.993 9.993 0 10-3.59 3.615L22 22l-1.344-4.992zM12 20a7.949 7.949 0 01-4.906-1.678l-.718-.7 4.914-.926a8 8 0 10-8.29-8.29l.926-4.914.7.718A8 8 0 1120 1[...]"/>
                  </svg>
                </button>
              </Link>
            </div>
            <div className="card-likes">{post.likesCount} likes</div>
            <div className="card-caption">
              <strong>{post.username}</strong> {post.caption}
            </div>
            {post.commentsCount > 0 && (
              <div className="comments-section">
                {post.recentComments?.map((comment) => (
                  <div key={comment.id} className="comment">
                    <strong>{comment.username}</strong> {comment.comment}
                  </div>
                ))}
                {post.commentsCount > 2 && (
                  <Link
                    to={`/post/${post.id}`}
                    className="view-comments"
                  >
                    View all {post.commentsCount} comments
                  </Link>
                )}
              </div>
            )}
            <div className="card-time">{formatTime(post.created_at)}</div>
          </div>
        </div>
      ))}
      {hasMore && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <button 
            onClick={handleLoadMore}
            disabled={loading}
            className="load-more-button"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
      {loading && posts.length === 0 && (
        <div className="loading">Loading feed...</div>
      )}
    </div>
  );
};

export default HomeFeed;
