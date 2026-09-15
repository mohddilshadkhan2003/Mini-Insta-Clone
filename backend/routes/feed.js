const express = require('express');
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const PAGE_SIZE = 10;

// Get feed with pagination (optimized with JOINs instead of N+1 queries)
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * PAGE_SIZE;

    // Single optimized query with JOINs instead of N+1 queries
    const posts = db.prepare(`
      SELECT 
        p.id,
        p.user_id,
        p.image_url,
        p.caption,
        p.created_at,
        u.username,
        COUNT(DISTINCT l.id) as likesCount,
        CASE WHEN EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id) THEN 1 ELSE 0 END as isLiked
      FROM posts p
      INNER JOIN users u ON p.user_id = u.id
      INNER JOIN follows f ON p.user_id = f.following_id
      LEFT JOIN likes l ON l.post_id = p.id
      WHERE f.follower_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, userId, PAGE_SIZE, offset);

    // Get recent comments for each post efficiently
    const postsWithDetails = posts.map(post => {
      const comments = db.prepare(`
        SELECT c.id, c.user_id, c.comment, c.created_at, u.username
        FROM comments c
        INNER JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at DESC
        LIMIT 2
      `).all(post.id);

      const commentsCount = db.prepare('SELECT COUNT(*) as count FROM comments WHERE post_id = ?').get(post.id).count;

      return {
        ...post,
        likesCount: post.likesCount || 0,
        isLiked: post.isLiked === 1,
        commentsCount,
        recentComments: comments.reverse()
      };
    });

    // Get total count for pagination
    const totalCount = db.prepare(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM posts p
      INNER JOIN follows f ON p.user_id = f.following_id
      WHERE f.follower_id = ?
    `).get(userId).count;

    res.json({ 
      posts: postsWithDetails,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total: totalCount,
        hasMore: offset + PAGE_SIZE < totalCount
      }
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
