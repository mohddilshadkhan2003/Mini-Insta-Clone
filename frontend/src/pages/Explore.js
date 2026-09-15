import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import PostModal from '../components/PostModal';

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Memoized fetch function
  const fetchExplorePosts = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/explore/posts', {
        params: { page: pageNum }
      });
      
      if (pageNum === 1) {
        setPosts(response.data.posts || []);
      } else {
        setPosts(prev => [...prev, ...response.data.posts]);
      }
      
      setHasMore(response.data.pagination?.hasMore || false);
    } catch (err) {
      console.error('Error fetching explore posts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExplorePosts(1);
  }, [fetchExplorePosts]);

  const handlePostClick = useCallback((post) => {
    setSelectedPostId(post.id);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedPostId(null);
  }, []);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchExplorePosts(nextPage);
  }, [page, fetchExplorePosts]);

  if (posts.length === 0 && !loading) {
    return (
      <div className="empty-state">
        <h2>No posts found</h2>
      </div>
    );
  }

  return (
    <>
      <div className="explore-grid">
        {posts.map((post) => {
          const imageUrl = post.image_url?.startsWith('/') 
            ? `http://localhost:5000${post.image_url}`
            : post.image_url;
          
          return (
            <div
              key={post.id}
              className="explore-post"
              onClick={() => handlePostClick(post)}
              style={{ cursor: 'pointer' }}
            >
              <img 
                src={imageUrl} 
                alt={post.caption || 'Post'}
                loading="lazy"
              />
              <div className="explore-post-overlay">
                <div className="explore-post-stats">
                  <span>❤️ {post.likesCount || 0}</span>
                  <span>💬 {post.commentsCount || 0}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
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
        <div className="loading">Loading...</div>
      )}
      {selectedPostId && (
        <PostModal postId={selectedPostId} onClose={handleCloseModal} />
      )}
    </>
  );
};

export default Explore;
