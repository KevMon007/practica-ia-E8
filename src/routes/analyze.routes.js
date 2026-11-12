const router = require('express').Router();
const validateRequest = require('../middleware/validateRequest');
const traditional = require('../engines/traditional/traditionalEngine');
const generative = require('../engines/generative/generativeEngine');

router.post('/analyze', validateRequest, async (req, res, next) => {
  try {
    const { message, mode } = req.body;
    const engine = mode === 'traditional' ? traditional : generative;
    const result = await engine.analyze(message);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
