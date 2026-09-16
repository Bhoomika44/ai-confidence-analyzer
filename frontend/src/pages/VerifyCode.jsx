import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VerifyCode = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const savedEmail = sessionStorage.getItem('resetEmail');

        if (!savedEmail) {
            navigate('/forgot-password');
            return;
        }

        setEmail(savedEmail);
    }, [navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();

        setError('');

        const cleanCode = code.trim();

        if (!cleanCode) {
            setError('Please enter the verification code.');
            return;
        }

        if (!/^\d{4,6}$/.test(cleanCode)) {
            setError('Please enter a valid verification code.');
            return;
        }

        // The backend validates the code when the password is reset.
        sessionStorage.setItem('resetCode', cleanCode);

        navigate('/reset-password');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Verify Your Email
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Enter the verification code sent to your email.
                    </p>

                    {email && (
                        <p className="text-sm font-medium text-gray-700 mt-3 break-all">
                            {email}
                        </p>
                    )}
                </div>

                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <label
                        htmlFor="code"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Verification Code
                    </label>

                    <input
                        id="code"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={code}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setCode(value);
                        }}
                        placeholder="Enter verification code"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-xl tracking-widest outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />

                    <button
                        type="submit"
                        className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
                    >
                        Verify Code
                    </button>

                </form>

                <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700"
                >
                    Use a different email
                </button>

            </div>
        </div>
    );
};

export default VerifyCode;