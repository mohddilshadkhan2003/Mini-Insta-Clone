const express = require('express');
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const PAGE_SIZE = 20;
const SEARCH_LIMIT = 20;

// Get explore posts with pagination (no ORDER BY RANDOM() - uses offset instead)
router.get('/posts', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * PAGE_SIZE;

    // Optimized single query with proper pagination (no random sort on entire table)
    const posts = db.prepare(`
      SELECT 
        p.id,
        p.user_id,
        p.image_url,
        p.caption,
        p.created_at,
        u.username,
        COUNT(DISTINCT l.id) as likesCount,
        CASE WHEN EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id) THEN 1 ELSE 0 END as isLiked,
        COUNT(DISTINCT c.id) as commentsCount
      FROM posts p
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON l.post_id = p.id
      LEFT JOIN comments c ON c.post_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, PAGE_SIZE, offset);

    const totalCount = db.prepare('SELECT COUNT(*) as count FROM posts').get().count;

    res.json({ 
      posts: posts.map(post => ({
        ...post,
        likesCount: post.likesCount || 0,
        isLiked: post.isLiked === 1,
        commentsCount: post.commentsCount || 0
      })),
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total: totalCount,
        hasMore: offset + PAGE_SIZE < totalCount
      }
    });
  } catch (error) {
    console.error('Get explore posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search users and posts
router.get('/search', authenticateToken, (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.userId;

    if (!q || q.trim().length === 0) {
      return res.json({ users: [], posts: [] });
    }

    const searchTerm = `%${q.trim()}%`;

    // Optimized user search
    const users = db.prepare(`
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.created_at,
        COUNT(DISTINCT f.follower_id) as followerCount,
        CASE WHEN EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) THEN 1 ELSE 0 END as isFollowing
      FROM users u
      LEFT JOIN follows f ON f.following_id = u.id
      WHERE (u.username LIKE ? OR u.email LIKE ?)
      AND u.id != ?
      GROUP BY u.id
      LIMIT ?
    `).all(currentUserId, searchTerm, searchTerm, currentUserId, SEARCH_LIMIT);

    // Optimized post search
    const posts = db.prepare(`
      SELECT 
        p.id,
        p.user_id,
        p.image_url,
        p.caption,
        p.created_at,
        u.username,
        COUNT(DISTINCT l.id) as likesCount,
        CASE WHEN EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id) THEN 1 ELSE 0 END as isLiked,
        COUNT(DISTINCT c.id) as commentsCount
      FROM posts p
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON l.post_id = p.id
      LEFT JOIN comments c ON c.post_id = p.id
      WHERE p.caption LIKE ? OR u.username LIKE ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ?
    `).all(currentUserId, searchTerm, searchTerm, SEARCH_LIMIT);

    res.json({ 
      users: users.map(u => ({
        ...u,
        followerCount: u.followerCount || 0,
        isFollowing: u.isFollowing === 1
      })),
      posts: posts.map(post => ({
        ...post,
        likesCount: post.likesCount || 0,
        isLiked: post.isLiked === 1,
        commentsCount: post.commentsCount || 0
      }))
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user suggestions with optimized queries
router.get('/suggestions', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;

    const suggestions = db.prepare(`
      SELECT 
        u.id, 
        u.username, 
        u.email,
        COUNT(DISTINCT f.follower_id) as followerCount
      FROM users u
      LEFT JOIN follows f ON f.following_id = u.id
      WHERE u.id != ?
      AND u.id NOT IN (
        SELECT following_id FROM follows WHERE follower_id = ?
      )
      GROUP BY u.id
      ORDER BY followerCount DESC
      LIMIT 5
    `).all(userId, userId);

    res.json({ 
      suggestions: suggestions.map(user => ({
        ...user,
        followerCount: user.followerCount || 0,
        mutualFollower: null // Simplified - can be added back if needed
      }))
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
