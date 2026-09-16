import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/api';

const ForgotPassword = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage('');
        setError('');

        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail) {
            setError('Please enter your email address.');
            return;
        }

        setLoading(true);

        try {
            const response = await forgotPassword(cleanEmail);

            setMessage(
                response.data?.message ||
                'A verification code has been sent to your email.'
            );

            // Save the email so the next page knows which account
            // the verification code belongs to.
            sessionStorage.setItem('resetEmail', cleanEmail);

            // Move to the verification page.
            navigate('/verify-code');
        } catch (err) {
            console.error('Forgot password error:', err);

            const serverMessage =
                err.response?.data?.message ||
                'Failed to process your request. Please try again.';

            setError(serverMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Forgot Password?
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Enter your registered email address and we will send you a
                        verification code.
                    </p>
                </div>

                {message && (
                    <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Email Address
                    </label>

                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your registered email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition"
                    >
                        {loading ? 'Sending...' : 'Send Verification Code'}
                    </button>

                </form>

                <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700"
                >
                    Back to Login
                </button>

            </div>
        </div>
    );
};

export default ForgotPassword;