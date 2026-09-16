const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserRepo } = require('../models/repo');
const { JWT_SECRET } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../services/emailService');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Please provide name, email, and password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await UserRepo.findOne({
      email: cleanEmail
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await UserRepo.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      resetCode: null,
      resetCodeExpires: null
    });

    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      },
      JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    res.status(201).json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);

    res.status(500).json({
      message: 'Server error during registration'
    });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await UserRepo.findOne({
      email: cleanEmail
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid email or password'
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name
      },
      JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);

    res.status(500).json({
      message: 'Server error during login'
    });
  }
};


exports.getMe = async (req, res) => {
  try {
    const user = await UserRepo.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Get user error:', error);

    res.status(500).json({
      message: 'Server error'
    });
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email address is required'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    console.log(`[Auth] Password reset requested for: ${cleanEmail}`);

    const user = await UserRepo.findOne({
      email: cleanEmail
    });

    if (!user) {
      console.log(`[Auth] No account found for: ${cleanEmail}`);

      return res.status(404).json({
        message: 'No account found with this email address'
      });
    }

    /*
      Generate a 4-digit verification code.

      The frontend also expects 4 digits.
    */
    const resetCode = Math.floor(
      1000 + Math.random() * 9000
    ).toString();

    /*
      Code remains valid for 15 minutes.
    */
    const resetCodeExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await UserRepo.findByIdAndUpdate(
      user.id,
      {
        resetCode,
        resetCodeExpires
      }
    );

    console.log(
      `[Auth] Reset code generated for ${cleanEmail}`
    );

    /*
      Send the verification code to the user's email.
    */
    const emailResult = await sendPasswordResetEmail(
      user.email,
      resetCode
    );

    if (!emailResult || !emailResult.success) {
      console.error(
        '[Auth] Failed to send reset email:',
        emailResult?.error
      );

      /*
        Remove the code because the email was not sent successfully.
      */
      await UserRepo.findByIdAndUpdate(
        user.id,
        {
          resetCode: null,
          resetCodeExpires: null
        }
      );

      return res.status(500).json({
        message:
          emailResult?.error ||
          'Failed to send verification email'
      });
    }

    console.log(
      `[Auth] Verification code sent successfully to ${cleanEmail}`
    );

    res.json({
      message:
        'A 4-digit verification code has been sent to your email address.',
      email: user.email,
      expiresIn: '15 minutes'
    });

  } catch (error) {
    console.error(
      'Forgot password error:',
      error
    );

    res.status(500).json({
      message:
        'Failed to process password reset request'
    });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    const {
      email,
      resetCode,
      newPassword
    } = req.body;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({
        message:
          'Email, reset code, and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message:
          'New password must be at least 6 characters'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = resetCode.trim();

    const user = await UserRepo.findOne({
      email: cleanEmail
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    if (!/^\d{4}$/.test(cleanCode)) {
      return res.status(400).json({
        message:
          'Verification code must contain 4 digits'
      });
    }

    if (!user.resetCode) {
      return res.status(400).json({
        message:
          'No active verification code. Please request a new code.'
      });
    }

    if (user.resetCode !== cleanCode) {
      return res.status(400).json({
        message: 'Invalid verification code'
      });
    }

    if (
      user.resetCodeExpires &&
      new Date(user.resetCodeExpires) < new Date()
    ) {
      return res.status(400).json({
        message:
          'Verification code has expired. Please request a new one.'
      });
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(
      newPassword,
      salt
    );

    /*
      Clear the verification code after successful use.
      This makes the code one-time use.
    */
    await UserRepo.findByIdAndUpdate(
      user.id,
      {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpires: null
      }
    );

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name
      },
      JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    console.log(
      `[Auth] Password reset successful for ${cleanEmail}`
    );

    res.json({
      message:
        'Password reset successful! You are now logged in.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    });

  } catch (error) {
    console.error(
      'Reset password error:',
      error
    );

    res.status(500).json({
      message:
        'Failed to reset password'
    });
  }
};