import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserRepository } from '../repositories/user.repository';
import { AuthPayload } from '../types';
import { UnauthorizedError } from '../errors/AppError';

export class AuthService {
  constructor(private userRepo: UserRepository) {}

  private toAuthPayload(user: { id: number | string; username: string; role: AuthPayload['role']; department_id: number | string | null }): AuthPayload {
    return {
      userId: Number(user.id),
      username: user.username,
      role: user.role,
      departmentId: user.department_id === null ? null : Number(user.department_id),
    };
  }

  async login(username: string, password: string): Promise<{ token: string; user: AuthPayload }> {
    const user = await this.userRepo.findByUsername(username);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const payload = this.toAuthPayload(user);

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
      algorithm: config.jwt.algorithm,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
      subject: String(user.id),
    });

    return { token, user: payload };
  }

  async getProfile(userId: number): Promise<AuthPayload> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return this.toAuthPayload(user);
  }
}
