import { Router } from 'express';
import {
  register,
  registerValidation,
  login,
  loginValidation,
} from '../controllers/auth.controller';

const router = Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

export default router;
