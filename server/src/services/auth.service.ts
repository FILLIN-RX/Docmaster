import { UserRepository } from '../repositories/auth.repository.ts';
import argon2 from 'argon2';
import crypto from 'crypto';
import { User } from '../types/database.ts';
import { generateToken } from '../config/jwt.ts';
import { ReferralService } from './referral.service.ts';

export class UserService {
  private userRepository = new UserRepository();

  /**
   * Generate a unique referral code
   * Format: 8-character alphanumeric (e.g., "ABC12XYZ")
   */
  private async generateUniqueReferralCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let isUnique = false;
    let code = '';

    while (!isUnique) {
      // Generate random 8-character code
      code = Array.from({ length: 8 })
        .map(() => characters[Math.floor(Math.random() * characters.length)])
        .join('');

      // Check if code already exists
      const existingUser = await this.userRepository.findByReferralCode(code);
      isUnique = !existingUser;
    }

    return code;
  }

  /**
   * Register a new user with referral code generation
   */
  async registerUser(data: any): Promise<User> {
    // Hash password
    const hashedPassword = await argon2.hash(data.mot_de_passe);

    // Generate unique referral code
    const codeInvitation = await this.generateUniqueReferralCode();

    // Create user with hashed password and referral code
    const user = await this.userRepository.createUser({
      ...data,
      mot_de_passe: hashedPassword,
      code_invitation: codeInvitation,
    });

    // If there is a parrain_id, create a referral
    if (data.parrain_id) {
      const referralService = new ReferralService();
      await referralService.createReferral(data.parrain_id, user.id);
    }

    return user;
  }

  /**
   * Verify user password
   */
  async verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
    return await argon2.verify(hashedPassword, plainPassword);
  }

  /**
   * Handle password reset request
   */
  async requestPasswordReset(email: string): Promise<string> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate reset token
    const token = await this.userRepository.forgotPassword(user.id);
    return token;
  }

  /**
   * Login user with email and password
   */
  async loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(user.mot_de_passe, password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.role);

    // Return user and token (without password hash)
    const { mot_de_passe, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword as any,
      token,
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<User> {
    // Verify token exists and is valid
    const resetToken = await this.userRepository.getResetToken(token);
    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await argon2.hash(newPassword);

    // Update password
    const user = await this.userRepository.updatePassword(resetToken.user_id, hashedPassword);

    // Mark token as used
    await this.userRepository.markResetTokenAsUsed(resetToken.id);

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: { 
    nom?: string, 
    prenom?: string, 
    telephone?: string, 
    photo_url?: string,
    date_naissance?: string,
    lieu_naissance?: string,
    currency?: string
  }): Promise<User> {
    const user = await this.userRepository.updateProfile(userId, data);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    return await this.userRepository.findById(userId);
  }

  /**
   * Get user by Referral Code
   */
  async getUserByReferralCode(code: string): Promise<User | null> {
    return await this.userRepository.findByReferralCode(code);
  }
}