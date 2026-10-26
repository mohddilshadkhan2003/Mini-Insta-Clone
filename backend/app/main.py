import sqlite3
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import APP_NAME, APP_ENV, APP_PORT, UPLOAD_DIR
from app.database import get_connection, init_db
from app.security import create_token, decode_token, hash_password, verify_password

app = FastAPI(title=APP_NAME, version="1.1.0", description="Mini Insta Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_PATH = Path(UPLOAD_DIR)
UPLOAD_PATH.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_PATH)), name="uploads")

init_db()


def get_current_user_from_token(authorization: Optional[str] = None):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    with get_connection() as conn:
        user = conn.execute(
            "SELECT id, username, email, bio, avatar FROM users WHERE id = ?",
            (payload["user_id"],),
        ).fetchone()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return dict(user)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": APP_NAME, "environment": APP_ENV}


@app.post("/api/auth/signup")
def signup(username: str, email: str, password: str):
    if len(username.strip()) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 chars")

    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 chars")

    if "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email format")

    hashed = hash_password(password)

    try:
        with get_connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO users (username, email, password, bio, avatar)
                VALUES (?, ?, ?, '', '')
                """,
                (username.strip(), email.lower(), hashed),
            )
            conn.commit()
            user_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    token = create_token(user_id, username.strip())

    return {
        "message": "User created successfully",
        "token": token,
        "user": {
            "id": user_id,
            "username": username.strip(),
            "email": email.lower(),
        },
    }


@app.post("/api/auth/login")
def login(email: str, password: str):
    with get_connection() as conn:
        user = conn.execute(
            "SELECT * FROM users WHERE email = ?",
            (email.lower(),),
        ).fetchone()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user["id"], user["username"])

    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
        },
    }


@app.get("/api/auth/me")
def me(authorization: Optional[str] = None):
    user = get_current_user_from_token(authorization)
    return {"user": user}


@app.get("/api/feed")
def get_feed(page: int = 1, authorization: Optional[str] = None):
    user = get_current_user_from_token(authorization)
    page = max(1, page)
    limit = 10
    offset = (page - 1) * limit

    with get_connection() as conn:
        posts = conn.execute(
            """
            SELECT
                p.id,
                p.user_id,
                p.image_url,
                p.caption,
                p.created_at,
                u.username,
                u.avatar,
                COUNT(DISTINCT l.id) AS likes_count,
                CASE WHEN EXISTS (
                    SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id
                ) THEN 1 ELSE 0 END AS is_liked
            FROM posts p
            INNER JOIN users u ON u.id = p.user_id
            INNER JOIN follows f ON f.following_id = p.user_id
            WHERE f.follower_id = ?
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
            """,
            (user["id"], user["id"], limit, offset),
        ).fetchall()

        result = []
        for post in posts:
            comments = conn.execute(
                """
                SELECT c.id, c.user_id, c.comment, c.created_at, u.username
                FROM comments c
                INNER JOIN users u ON u.id = c.user_id
                WHERE c.post_id = ?
                ORDER BY c.created_at DESC
                LIMIT 3
                """,
                (post["id"],),
            ).fetchall()

            result.append(
                {
                    "id": post["id"],
                    "user_id": post["user_id"],
                    "username": post["username"],
                    "avatar": post["avatar"],
                    "image_url": post["image_url"],
                    "caption": post["caption"],
                    "created_at": post["created_at"],
                    "likes_count": post["likes_count"],
                    "is_liked": bool(post["is_liked"]),
                    "comments": [dict(c) for c in comments],
                }
            )

        total_count = conn.execute(
            """
            SELECT COUNT(DISTINCT p.id) AS total
            FROM posts p
            INNER JOIN follows f ON f.following_id = p.user_id
            WHERE f.follower_id = ?
            """,
            (user["id"],),
        ).fetchone()["total"]

    return {
        "posts": result,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total_count,
            "has_more": offset + limit < total_count,
        },
    }


@app.post("/api/posts")
async def create_post(
    caption: str = "",
    image: UploadFile = File(...),
    authorization: Optional[str] = None,
):
    user = get_current_user_from_token(authorization)

    if image is None:
        raise HTTPException(status_code=400, detail="Image file is required")

    filename = f"{uuid.uuid4().hex}_{image.filename}"
    file_path = UPLOAD_PATH / filename
    with open(file_path, "wb") as file:
        file.write(await image.read())

    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO posts (user_id, image_url, caption)
            VALUES (?, ?, ?)
            """,
            (user["id"], f"/uploads/{filename}", caption),
        )
        conn.commit()
        post_id = cursor.lastrowid

    return {
        "message": "Post created successfully",
        "post": {
            "id": post_id,
            "user_id": user["id"],
            "image_url": f"/uploads/{filename}",
            "caption": caption,
            "created_at": datetime.utcnow().isoformat(),
        },
    }


@app.get("/api/posts/{post_id}")
def get_post(post_id: int, authorization: Optional[str] = None):
    user = get_current_user_from_token(authorization)

    with get_connection() as conn:
        post = conn.execute(
            """
            SELECT
                p.id,
                p.user_id,
                p.image_url,
                p.caption,
                p.created_at,
                u.username,
                u.avatar,
                COUNT(DISTINCT l.id) AS likes_count,
                CASE WHEN EXISTS (
                    SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id
                ) THEN 1 ELSE 0 END AS is_liked
            FROM posts p
            INNER JOIN users u ON u.id = p.user_id
            LEFT JOIN likes l ON l.post_id = p.id
            WHERE p.id = ?
            GROUP BY p.id
            """,
            (user["id"], post_id),
        ).fetchone()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    with get_connection() as conn:
        comments = conn.execute(
            """
            SELECT c.id, c.user_id, c.comment, c.created_at, u.username
            FROM comments c
            INNER JOIN users u ON u.id = c.user_id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC
            """,
            (post_id,),
        ).fetchall()

    return {
        "post": {
            "id": post["id"],
            "user_id": post["user_id"],
            "username": post["username"],
            "avatar": post["avatar"],
            "image_url": post["image_url"],
            "caption": post["caption"],
            "created_at": post["created_at"],
            "likes_count": post["likes_count"],
            "is_liked": bool(post["is_liked"]),
            "comments": [dict(c) for c in comments],
        }
    }


@app.post("/api/posts/{post_id}/like")
def like_post(post_id: int, authorization: Optional[str] = None):
    user = get_current_user_from_token(authorization)

    with get_connection() as conn:
        post = conn.execute("SELECT id FROM posts WHERE id = ?", (post_id,)).fetchone()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")

        exists = conn.execute(
            "SELECT id FROM likes WHERE user_id = ? AND post_id = ?",
            (user["id"], post_id),
        ).fetchone()

        if exists:
            raise HTTPException(status_code=400, detail="Post already liked")

        conn.execute(
            "INSERT INTO likes (user_id, post_id) VALUES (?, ?)",
            (user["id"], post_id),
        )
        conn.commit()

    return {"message": "Post liked successfully"}


@app.post("/api/posts/{post_id}/unlike")
def unlike_post(post_id: int, authorization: Optional[str] = None):
    user = get_current_user_from_token(authorization)

    with get_connection() as conn:
        post = conn.execute("SELECT id FROM posts WHERE id = ?", (post_id,)).fetchone()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")

        exists = conn.execute(
            "SELECT id FROM likes WHERE user_id = ? AND post_id = ?",
            (user["id"], post_id),
        ).fetchone()

        if not exists:
            raise HTTPException(status_code=400, detail="Post not liked")

        conn.execute(
            "DELETE FROM likes WHERE user_id = ? AND post_id = ?",
            (user["id"], post_id),
        )
        conn.commit()

    return {"message": "Post unliked successfully"}


@app.post("/api/posts/{post_id}/comment")
def add_comment(post_id: int, comment: str, authorization: Optional[str] = None):
    user = get_current_user_from_token(authorization)

    if not comment or not comment.strip():
        raise HTTPException(status_code=400, detail="Comment text is required")

    with get_connection() as conn:
        post = conn.execute("SELECT id FROM posts WHERE id = ?", (post_id,)).fetchone()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")

        cursor = conn.execute(
            "INSERT INTO comments (user_id, post_id, comment) VALUES (?, ?, ?)",
            (user["id"], post_id, comment.strip()),
        )
        conn.commit()
        comment_id = cursor.lastrowid

        new_comment = conn.execute(
            """
            SELECT c.id, c.user_id, c.comment, c.created_at, u.username
            FROM comments c
            INNER JOIN users u ON u.id = c.user_id
            WHERE c.id = ?
            """,
            (comment_id,),
        ).fetchone()

    return {
        "message": "Comment added successfully",
        "comment": dict(new_comment),
    }


@app.get("/api/users/{user_id}")
def get_user_profile(user_id: int, authorization: Optional[str] = None):
    user = get_current_user_from_token(authorization)

    with get_connection() as conn:
        profile = conn.execute(
            """
            SELECT
                u.id,
                u.username,
                u.email,
                u.bio,
                u.avatar,
                (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS posts_count,
                (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count,
                (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count
            FROM users u
            WHERE u.id = ?
            """,
            (user_id,),
        ).fetchone()

    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    user_posts = conn.execute(
        """
        SELECT
            p.id,
            p.image_url,
            p.caption,
            p.created_at,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count
        FROM posts p
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
        """,
        (user_id,),
    ).fetchall()

    is_following = conn.execute(
        "SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?",
        (user["id"], user_id),
    ).fetchone()

    return {
        "user": {
            "id": profile["id"],
            "username": profile["username"],
            "email": profile["email"],
            "bio": profile["bio"],
            "avatar": profile["avatar"],
            "posts_count": profile["posts_count"],
            "following_count": profile["following_count"],
            "followers_count": profile["followers_count"],
        },
        "is_following": bool(is_following),
        "posts": [dict(post) for post in user_posts],
    }


@app.post("/api/users/{user_id}/follow")
def follow_user(user_id: int, authorization: Optional[str] = None):
    user = get_current_user_from_token(authorization)

    if user_id == user["id"]:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    with get_connection() as conn:
        target = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
        if not target:
            raise HTTPException(status_code=404, detail="User not found")

        exists = conn.execute(
            "SELECT id FROM follows WHERE follower_id = ? AND following_id = ?",
            (user["id"], user_id),
        ).fetchone()

        if exists:
            raise HTTPException(status_code=400, detail="Follow already exists")

        conn.execute(
            "INSERT INTO follows (follower_id, following_id) VALUES (?, ?)",
            (user["id"], user_id),
        )
        conn.commit()

    return {"message": "User followed successfully"}


@app.post("/api/users/{user_id}/unfollow")
def unfollow_user(user_id: int, authorization: Optional[str] = None):
    user = get_current_user_from_token(authorization)

    with get_connection() as conn:
        target = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
        if not target:
            raise HTTPException(status_code=404, detail="User not found")

        exists = conn.execute(
            "SELECT id FROM follows WHERE follower_id = ? AND following_id = ?",
            (user["id"], user_id),
        ).fetchone()

        if not exists:
            raise HTTPException(status_code=400, detail="User not unfollowed")

        conn.execute(
            "DELETE FROM follows WHERE follower_id = ? AND following_id = ?",
            (user["id"], user_id),
        )
        conn.commit()

    return {"message": "User unfollowed successfully"}


@app.get("/api/explore/search")
def search_posts(q: str = Query(..., min_length=1), authorization: Optional[str] = None):
    get_current_user_from_token(authorization)

    with get_connection() as conn:
        results = conn.execute(
            """
            SELECT
                p.id,
                p.user_id,
                p.image_url,
                p.caption,
                p.created_at,
                u.username,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count
            FROM posts p
            INNER JOIN users u ON u.id = p.user_id
            WHERE p.caption LIKE ? OR u.username LIKE ?
            ORDER BY p.created_at DESC
            LIMIT 10
            """,
            (f"%{q}%", f"%{q}%"),
        ).fetchall()

    return {
        "query": q,
        "results": [dict(row) for row in results],
    }


@app.get("/api/explore/suggestions")
def suggestions(authorization: Optional[str] = None):
    user = get_current_user_from_token(authorization)

    with get_connection() as conn:
        suggestions = conn.execute(
            """
            SELECT
                u.id,
                u.username,
                u.bio,
                u.avatar,
                (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count
            FROM users u
            WHERE u.id != ?
            ORDER BY u.username ASC
            LIMIT 10
            """,
            (user["id"],),
        ).fetchall()

    return {"people": [dict(row) for row in suggestions]}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=APP_PORT, reload=True)
