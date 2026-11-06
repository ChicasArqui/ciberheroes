
const express = require('express');
const {
  getLessons,
  getLesson,
  answerQuestion
} = require('./learning.service');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(getLessons());
});

router.get('/:id', (req, res) => {
  const lesson = getLesson(req.params.id);

  if (!lesson) {
    return res.status(404).json({ error: 'Leccion no encontrada' });
  }

  return res.json(lesson);
});

router.post('/:id/responder', (req, res) => {
  const { questionId, answer } = req.body || {};

  const result = answerQuestion(req.params.id, questionId, answer);

  if (!result) {
    return res.status(404).json({
      error: 'Leccion o pregunta no encontrada'
    });
  }

  if (result.error) {
    return res.status(400).json(result);
  }

  return res.json(result);
});

module.exports = router;
