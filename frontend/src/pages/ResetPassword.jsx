import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/api';

const ResetPassword = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const savedEmail = sessionStorage.getItem('resetEmail');
        const savedCode = sessionStorage.getItem('resetCode');

        if (!savedEmail || !savedCode) {
            navigate('/forgot-password');
            return;
        }

        setEmail(savedEmail);
        setResetCode(savedCode);
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');
        setSuccess('');

        if (!newPassword || !confirmPassword) {
            setError('Please enter and confirm your new password.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const response = await resetPassword({
                email,
                resetCode,
                newPassword
            });

            const data = response.data;

            if (data.token) {
                localStorage.setItem('token', data.token);
            }

            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            sessionStorage.removeItem('resetEmail');
            sessionStorage.removeItem('resetCode');

            setSuccess('Password reset successful!');

            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } catch (err) {
            console.error('Reset password error:', err);

            setError(
                err.response?.data?.message ||
                'Failed to reset password. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Create New Password
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Enter a new password for your account.
                    </p>

                    {email && (
                        <p className="text-sm text-gray-700 mt-3 break-all">
                            {email}
                        </p>
                    )}
                </div>

                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <label
                        htmlFor="newPassword"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        New Password
                    </label>

                    <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        disabled={loading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />

                    <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-700 mb-2 mt-5"
                    >
                        Confirm New Password
                    </label>

                    <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        disabled={loading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition"
                    >
                        {loading ? 'Resetting Password...' : 'Reset Password'}
                    </button>

                </form>

            </div>
        </div>
    );
};

export default ResetPassword;