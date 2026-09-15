const express = require('express');
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const PAGE_SIZE = 12; // Posts per page for user profile

router.get('/:userId', authenticateToken, (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * PAGE_SIZE;

    // Get user info
    const user = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get follower and following counts with single query
    const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followerCount,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as followingCount
    `).get(userId, userId);

    // Check if current user follows this user
    const followStatus = db.prepare(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?'
    ).get(currentUserId, userId);

    // Get user's posts with pagination
    const posts = db.prepare(`
      SELECT 
        p.id,
        p.user_id,
        p.image_url,
        p.caption,
        p.created_at,
        COUNT(DISTINCT l.id) as likesCount
      FROM posts p
      LEFT JOIN likes l ON l.post_id = p.id
      WHERE p.user_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, PAGE_SIZE, offset);

    // Get total post count
    const postCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?').get(userId).count;

    res.json({
      user: {
        ...user,
        followerCount: stats.followerCount || 0,
        followingCount: stats.followingCount || 0,
        isFollowing: currentUserId === parseInt(userId) ? null : (followStatus ? true : false)
      },
      posts: posts.map(p => ({
        ...p,
        likesCount: p.likesCount || 0
      })),
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total: postCount,
        hasMore: offset + PAGE_SIZE < postCount
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:userId/follow', authenticateToken, (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    if (currentUserId === parseInt(userId)) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if user exists
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const existingFollow = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(currentUserId, userId);
    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(currentUserId, userId);

    res.json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:userId/unfollow', authenticateToken, (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    const existingFollow = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(currentUserId, userId);
    if (!existingFollow) {
      return res.status(400).json({ error: 'Not following this user' });
    }

    db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(currentUserId, userId);

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
