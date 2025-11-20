/**
 * Authentication Service
 * Handles user login, registration, and session management
 */

// Browser API type declarations
declare const localStorage: Storage;
declare function btoa(data: string): string;

export interface User {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'email';
  isPremium: boolean;
  freeMessagesRemaining: number;
  createdAt: Date;
  lastLogin: Date;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export class AuthService {
  private currentUser: User | null = null;
  private readonly FREE_MESSAGE_LIMIT = 10;

  /**
   * Initialize Google OAuth
   */
  async initGoogleAuth(): Promise<void> {
    // In production, use Google OAuth SDK
    // For now, this is a placeholder
    console.log('Google Auth initialized');
  }

  /**
   * Login with Google
   */
  async loginWithGoogle(): Promise<AuthResponse> {
    try {
      // In production, integrate with Google OAuth
      // This is a mock implementation
      const mockUser: User = {
        id: `google_${Date.now()}`,
        email: 'user@gmail.com',
        name: 'Google User',
        provider: 'google',
        isPremium: false,
        freeMessagesRemaining: this.FREE_MESSAGE_LIMIT,
        createdAt: new Date(),
        lastLogin: new Date()
      };

      this.currentUser = mockUser;
      this.saveUserToStorage(mockUser);

      return {
        success: true,
        user: mockUser,
        token: this.generateToken(mockUser)
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to login with Google'
      };
    }
  }

  /**
   * Register with email
   */
  async registerWithEmail(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      // Validate email
      if (!this.isValidEmail(email)) {
        return {
          success: false,
          error: 'Invalid email address'
        };
      }

      // Validate password
      if (password.length < 8) {
        return {
          success: false,
          error: 'Password must be at least 8 characters'
        };
      }

      // In production, send to backend API
      const newUser: User = {
        id: `email_${Date.now()}`,
        email,
        name,
        provider: 'email',
        isPremium: false,
        freeMessagesRemaining: this.FREE_MESSAGE_LIMIT,
        createdAt: new Date(),
        lastLogin: new Date()
      };

      this.currentUser = newUser;
      this.saveUserToStorage(newUser);

      return {
        success: true,
        user: newUser,
        token: this.generateToken(newUser)
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to register'
      };
    }
  }

  /**
   * Login with email
   */
  async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    try {
      // In production, verify with backend
      const storedUser = this.getUserFromStorage();
      
      if (storedUser && storedUser.email === email) {
        this.currentUser = storedUser;
        return {
          success: true,
          user: storedUser,
          token: this.generateToken(storedUser)
        };
      }

      return {
        success: false,
        error: 'Invalid email or password'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to login'
      };
    }
  }

  /**
   * Logout
   */
  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    if (!this.currentUser) {
      this.currentUser = this.getUserFromStorage();
    }
    return this.currentUser;
  }

  /**
   * Check if user can send message (has free messages or is premium)
   */
  canSendMessage(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    return user.isPremium || user.freeMessagesRemaining > 0;
  }

  /**
   * Decrement free message count
   */
  decrementFreeMessages(): void {
    if (this.currentUser && !this.currentUser.isPremium) {
      this.currentUser.freeMessagesRemaining--;
      this.saveUserToStorage(this.currentUser);
    }
  }

  /**
   * Get remaining free messages
   */
  getRemainingMessages(): number {
    const user = this.getCurrentUser();
    return user?.isPremium ? Infinity : (user?.freeMessagesRemaining || 0);
  }

  /**
   * Upgrade to premium
   */
  async upgradeToPremium(paymentToken: string): Promise<boolean> {
    try {
      // In production, process payment with Stripe/PayPal
      if (this.currentUser) {
        this.currentUser.isPremium = true;
        this.saveUserToStorage(this.currentUser);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // Helper methods

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private generateToken(user: User): string {
    // In production, use JWT
    return btoa(JSON.stringify({ userId: user.id, timestamp: Date.now() }));
  }

  private saveUserToStorage(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }
}
