const express = require('express');
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/', authenticateToken, upload.single('image'), (req, res) => {
  try {
    const { caption } = req.body;
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const result = db.prepare('INSERT INTO posts (user_id, image_url, caption) VALUES (?, ?, ?)').run(
      userId,
      imageUrl,
      caption || ''
    );

    // Avoid additional SELECT - construct response from inserted data
    const post = {
      id: result.lastInsertRowid,
      user_id: userId,
      image_url: imageUrl,
      caption: caption || '',
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:postId', authenticateToken, (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    // Optimized single query with JOINs
    const post = db.prepare(`
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
      LEFT JOIN likes l ON l.post_id = p.id
      WHERE p.id = ?
      GROUP BY p.id
    `).get(userId, postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get all comments efficiently
    const comments = db.prepare(`
      SELECT c.id, c.user_id, c.comment, c.created_at, u.username
      FROM comments c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(postId);

    res.json({
      post: {
        ...post,
        likesCount: post.likesCount || 0,
        isLiked: post.isLiked === 1,
        comments
      }
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:postId/like', authenticateToken, (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    // Check if post exists
    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if already liked
    const existingLike = db.prepare('SELECT id FROM likes WHERE user_id = ? AND post_id = ?').get(userId, postId);
    if (existingLike) {
      return res.status(400).json({ error: 'Post already liked' });
    }

    db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').run(userId, postId);

    res.json({ message: 'Post liked successfully' });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:postId/unlike', authenticateToken, (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const existingLike = db.prepare('SELECT id FROM likes WHERE user_id = ? AND post_id = ?').get(userId, postId);
    if (!existingLike) {
      return res.status(400).json({ error: 'Post not liked' });
    }

    db.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').run(userId, postId);

    res.json({ message: 'Post unliked successfully' });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:postId/comment', authenticateToken, (req, res) => {
  try {
    const { postId } = req.params;
    const { comment } = req.body;
    const userId = req.user.userId;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    // Check if post exists
    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const result = db.prepare('INSERT INTO comments (user_id, post_id, comment) VALUES (?, ?, ?)').run(
      userId,
      postId,
      comment.trim()
    );

    // Get the newly inserted comment with username
    const newComment = db.prepare(`
      SELECT c.id, c.user_id, c.comment, c.created_at, u.username
      FROM comments c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
