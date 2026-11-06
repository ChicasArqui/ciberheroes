
const lessons = [
  {
    id: 1,
    title: 'Contraseñas seguras',
    description: 'Aprende a proteger tus cuentas.',
    questions: [
      {
        id: 1,
        text: '¿Cuál es la contraseña más segura?',
        options: [
          '123456',
          'MiNombre2026',
          'T7!mQ9#vL2'
        ],
        correctAnswer: 2
      }
    ]
  },
  {
    id: 2,
    title: 'Detectando phishing',
    description: 'Aprende a reconocer mensajes sospechosos.',
    questions: [
      {
        id: 1,
        text: '¿Qué haces si recibes un enlace sospechoso?',
        options: [
          'Lo abro inmediatamente',
          'Lo verifico con un adulto de confianza',
          'Comparto el enlace'
        ],
        correctAnswer: 1
      }
    ]
  }
];

function getLessons() {
  return lessons.map(({ id, title, description }) => ({
    id,
    title,
    description
  }));
}

function getLesson(id) {
  const lesson = lessons.find(item => item.id === Number(id));

  if (!lesson) return null;

  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    questions: lesson.questions.map(({ id, text, options }) => ({
      id,
      text,
      options
    }))
  };
}

function answerQuestion(lessonId, questionId, answer) {
  const lesson = lessons.find(item => item.id === Number(lessonId));

  if (!lesson) return null;

  const question = lesson.questions.find(
    item => item.id === Number(questionId)
  );

  if (!question) return null;

  if (!Number.isInteger(answer) ||
      answer < 0 ||
      answer >= question.options.length) {
    return { error: 'Respuesta invalida' };
  }

  const correct = question.correctAnswer === answer;

  return {
    correct,
    xpEarned: correct ? 10 : 0,
    message: correct ? '¡Excelente trabajo!' : 'Intenta nuevamente'
  };
}

module.exports = {
  getLessons,
  getLesson,
  answerQuestion
};
