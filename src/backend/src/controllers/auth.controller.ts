import { Request, Response } from 'express';
import { authenticator } from 'otplib';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@prisma';
import dotenv from 'dotenv';


dotenv.config();

const JWT_SECRET = process.env.SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT SECRET is not set');
}

// Zod validation schema for profile updates
const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  surname: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

// Helper function to calculate profile fill percentage
const calculateProfileFillPercentage = (user: {
  name: string | null;
  surname: string | null;
  email: string | null;
}): number => {
  const fields = [user.name, user.surname, user.email];
  const filledFields = fields.filter(field => field !== null && field !== '').length;
  return Math.round((filledFields / fields.length) * 100);
};

export const registerStart = async (req: Request, res: Response) => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Generate TOTP secret
    const secret = authenticator.generateSecret();

    // Create user with TOTP secret but not confirmed
    const user = await prisma.user.create({
      data: {
        username,
        totpSecret: secret,
        totpConfirmed: false,
      },
    });

    // Return the secret for frontend to generate QR code
    return res.status(201).json({
      userId: user.id,
      username: user.username,
      totpSecret: secret,
    });
  } catch (error) {
    console.error('Register start error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const registerConfirm = async (req: Request, res: Response) => {
  try {
    const { username, token } = req.body;

    if (!username || !token) {
      return res.status(400).json({ error: 'Username and token are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.totpConfirmed) {
      return res.status(400).json({ error: 'User already confirmed' });
    }

    // Verify TOTP token
    const verified = authenticator.check(token, user.totpSecret);

    if (!verified) {
      return res.status(401).json({ error: 'Invalid TOTP code' });
    }

    // Mark user as confirmed
    await prisma.user.update({
      where: { id: user.id },
      data: { totpConfirmed: true },
    });

    return res.status(200).json({ message: 'Registration confirmed successfully' });
  } catch (error) {
    console.error('Register confirm error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, token } = req.body;

    if (!username || !token) {
      return res.status(400).json({ error: 'Username and token are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.totpConfirmed) {
      return res.status(401).json({ error: 'User registration not confirmed' });
    }

    // Verify TOTP token
    const verified = authenticator.check(token, user.totpSecret);

    if (!verified) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };
    const jwtToken = jwt.sign(payload, JWT_SECRET!, { expiresIn: '7d' });

    // Set HTTP-only cookie
    res.cookie('auth_token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    // User info is attached by auth middleware
    const userFromToken = (req as any).user;

    if (!userFromToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Fetch full user data from database
    const user = await prisma.user.findUnique({
      where: { id: userFromToken.userId },
      select: {
        id: true,
        username: true,
        role: true,
        name: true,
        surname: true,
        email: true,
        totpConfirmed: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate profile fill percentage
    const profileFillPercentage = calculateProfileFillPercentage(user);

    return res.status(200).json({
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      surname: user.surname,
      email: user.email,
      totpConfirmed: user.totpConfirmed,
      profileFillPercentage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userFromToken = (req as any).user;

    if (!userFromToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Validate request body with Zod
    const validationResult = profileUpdateSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const { name, surname, email } = validationResult.data;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userFromToken.userId) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userFromToken.userId },
      data: {
        ...(name !== undefined && { name }),
        ...(surname !== undefined && { surname }),
        ...(email !== undefined && { email }),
      },
      select: {
        id: true,
        username: true,
        role: true,
        name: true,
        surname: true,
        email: true,
        totpConfirmed: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Calculate profile fill percentage
    const profileFillPercentage = calculateProfileFillPercentage(updatedUser);

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        name: updatedUser.name,
        surname: updatedUser.surname,
        email: updatedUser.email,
        totpConfirmed: updatedUser.totpConfirmed,
        profileFillPercentage,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
