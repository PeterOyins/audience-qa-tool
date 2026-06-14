require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => res.send('QA Tool API running'));

// Create room
app.post('/rooms', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Room name is required' });

    const id = nanoid(6);
    try {
        await pool.query('INSERT INTO rooms (id, name) VALUES ($1, $2)', [id, name]);
        res.json({ id, name, url: `/room/${id}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get room by ID
app.get('/rooms/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Room not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get questions for a room
app.get('/rooms/:id/questions', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM questions 
             WHERE room_id = $1 AND status = 'active' 
             ORDER BY upvotes DESC, created_at ASC`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit a question
app.post('/rooms/:roomId/questions', async (req, res) => {
    const { text } = req.body;
    if (!text || text.trim().length === 0) return res.status(400).json({ error: 'Question text is required' });
    if (text.length > 280) return res.status(400).json({ error: 'Question must be 280 characters or less' });

    try {
        const result = await pool.query(
            'INSERT INTO questions (room_id, text) VALUES ($1, $2) RETURNING *',
            [req.params.roomId, text.trim()]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upvote a question
app.post('/questions/:id/upvote', async (req, res) => {
    try {
        const result = await pool.query(
            'UPDATE questions SET upvotes = upvotes + 1 WHERE id = $1 RETURNING *',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Question not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Archive a question
app.post('/questions/:id/archive', async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE questions SET status = 'archived' WHERE id = $1 RETURNING *`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Question not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a question
app.delete('/questions/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM questions WHERE id = $1 RETURNING *',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Question not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));