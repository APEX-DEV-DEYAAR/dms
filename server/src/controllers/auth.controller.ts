import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ValidationError } from '../errors/AppError';

export class AuthController {
  constructor(private authService: AuthService) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        throw new ValidationError('Username and password are required');
      }
      const result = await this.authService.login(username, password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await this.authService.getProfile(req.user!.userId);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  };
}
