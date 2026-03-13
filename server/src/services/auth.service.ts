import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserRepository } from '../repositories/user.repository';
import { AuthPayload, RefreshTokenPayload } from '../types';
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

  async login(username: string, password: string): Promise<{ token: string; refreshToken: string; user: AuthPayload }> {
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

    const refreshPayload: RefreshTokenPayload = { userId: Number(user.id), type: 'refresh' };
    const refreshToken = jwt.sign(refreshPayload, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn as any,
      algorithm: config.jwt.algorithm,
      issuer: config.jwt.issuer,
      subject: String(user.id),
    });

    return { token, refreshToken, user: payload };
  }

  async refresh(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    let decoded: RefreshTokenPayload;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.secret, {
        algorithms: [config.jwt.algorithm],
        issuer: config.jwt.issuer,
      }) as RefreshTokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('Invalid token type');
    }

    const user = await this.userRepo.findById(decoded.userId);
    if (!user || !user.is_active) {
      throw new UnauthorizedError('User not found or inactive');
    }

    const payload = this.toAuthPayload(user);

    const newToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
      algorithm: config.jwt.algorithm,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
      subject: String(user.id),
    });

    const newRefreshPayload: RefreshTokenPayload = { userId: Number(user.id), type: 'refresh' };
    const newRefreshToken = jwt.sign(newRefreshPayload, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn as any,
      algorithm: config.jwt.algorithm,
      issuer: config.jwt.issuer,
      subject: String(user.id),
    });

    return { token: newToken, refreshToken: newRefreshToken };
  }

  async getProfile(userId: number): Promise<AuthPayload> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return this.toAuthPayload(user);
  }
}
