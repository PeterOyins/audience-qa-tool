const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('QA Tool API running'));

app.use(express.static('public'));

// Generate a short unique ID for rooms
const { nanoid } = require('nanoid');

app.post('/rooms', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Room name is required' });

  const id = nanoid(6); // e.g. "x7f3kq"

  db.run(
    'INSERT INTO rooms (id, name) VALUES (?, ?)',
    [id, name],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, name, url: `/room/${id}` });
    }
  );
});

//SUBMIT A QUESTION TO A ROOM
app.post('/rooms/:roomId/questions', (req, res) => {
  const { roomId } = req.params;
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Question text is required' });
  }
  if (text.length > 280) {
    return res.status(400).json({ error: 'Question must be 280 characters or less' });
  }

  db.run(
    'INSERT INTO questions (room_id, text) VALUES (?, ?)',
    [roomId, text.trim()],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, room_id: roomId, text, upvotes: 0, status: 'active' });
    }
  );
});

// GET QUESTIONS FOR A ROOM, SORTED BY UPVOTES DESC AND CREATED_AT ASC
app.get('/rooms/:roomId/questions', (req, res) => {
  const { roomId } = req.params;

  db.all(
    `SELECT * FROM questions 
     WHERE room_id = ? AND status = 'active' 
     ORDER BY upvotes DESC, created_at ASC`,
    [roomId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// UPVOTE A QUESTION
app.post('/questions/:id/upvote', (req, res) => {
  const { id } = req.params;

  db.run(
    'UPDATE questions SET upvotes = upvotes + 1 WHERE id = ?',
    [id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Question not found' });
      res.json({ success: true });
    }
  );
});

// ARCHIVE A QUESTION (SO IT NO LONGER APPEARS IN THE ACTIVE LIST)
app.post('/questions/:id/archive', (req, res) => {
  const { id } = req.params;

  db.run(
    `UPDATE questions SET status = 'archived' WHERE id = ?`,
    [id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Question not found' });
      res.json({ success: true });
    }
  );
});

// GET ROOM DETAILS
app.get('/rooms/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM rooms WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Room not found' });
        res.json(row);
    });
});
app.listen(3000, () => console.log('Server on http://localhost:3000'));
