'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const RatePhotographerContent = () => {
    const searchParams = useSearchParams();
    const photographerId = searchParams.get('id');
    const [rating, setRating] = useState<number>(0);
    const [hover, setHover] = useState<number>(0);
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [photographerName, setPhotographerName] = useState('');

    useEffect(() => {
        if (photographerId) {
            // Fetch photographer details to show the name
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/photographers/${photographerId}/`)
                .then(res => res.json())
                .then(data => {
                    if (data.full_name) setPhotographerName(data.full_name);
                })
                .catch(err => console.error("Error fetching photographer:", err));
        }
    }, [photographerId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/photographer-ratings/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    photographer: photographerId,
                    rating,
                    feedback,
                }),
            });

            if (response.ok) {
                setSubmitted(true);
            } else {
                const data = await response.json();
                setError(data.detail || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            setError('Failed to submit rating. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="thank-you-container">
                <style jsx>{`
                    .thank-you-container {
                        max-width: 500px;
                        margin: 100px auto;
                        padding: 40px;
                        text-align: center;
                        background: #0a0a0a;
                        border: 1px solid #c5a059;
                        border-radius: 12px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                        color: #fff;
                        font-family: 'Inter', sans-serif;
                    }
                    h2 { color: #c5a059; margin-bottom: 20px; }
                    p { font-size: 1.1rem; opacity: 0.9; }
                `}</style>
                <div className="check-icon" style={{ fontSize: '4rem', color: '#c5a059', marginBottom: '20px' }}>✓</div>
                <h2>Thank You!</h2>
                <p>Your feedback helps us provide a premium experience. We appreciate your time.</p>
                <button 
                    onClick={() => window.location.href = '/'}
                    style={{
                        marginTop: '30px',
                        padding: '12px 24px',
                        background: 'transparent',
                        border: '1px solid #c5a059',
                        color: '#c5a059',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = '#c5a059';
                        e.currentTarget.style.color = '#000';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#c5a059';
                    }}
                >
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="rating-page">
            <style jsx>{`
                .rating-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #050505;
                    font-family: 'Inter', sans-serif;
                    padding: 20px;
                }
                .rating-card {
                    width: 100%;
                    max-width: 550px;
                    background: #0a0a0a;
                    border: 1px solid rgba(197, 160, 89, 0.2);
                    padding: 40px;
                    border-radius: 16px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { color: #fff; font-size: 1.8rem; margin-bottom: 8px; font-weight: 600; }
                .header p { color: #888; font-size: 1rem; }
                .photographer-name { color: #c5a059; font-weight: 500; }
                
                .stars-container {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    margin-bottom: 30px;
                }
                .star {
                    font-size: 2.5rem;
                    background: none;
                    border: none;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                    color: #222;
                }
                .star.on { color: #c5a059; }
                .star:hover { transform: scale(1.1); }
                
                .form-group { margin-bottom: 25px; }
                label { display: block; color: #fff; margin-bottom: 10px; font-size: 0.9rem; opacity: 0.8; }
                textarea {
                    width: 100%;
                    background: #111;
                    border: 1px solid #222;
                    border-radius: 8px;
                    padding: 15px;
                    color: #fff;
                    resize: none;
                    font-family: inherit;
                    transition: border-color 0.3s ease;
                }
                textarea:focus { outline: none; border-color: #c5a059; }
                
                .submit-btn {
                    width: 100%;
                    padding: 15px;
                    background: #c5a059;
                    color: #000;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .submit-btn:hover:not(:disabled) { background: #d4b47a; transform: translateY(-2px); }
                .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                
                .error-msg {
                    color: #ff4d4f;
                    text-align: center;
                    margin-top: 15px;
                    font-size: 0.9rem;
                }
            `}</style>

            <div className="rating-card">
                <div className="header">
                    <h1>Rate Your Experience</h1>
                    <p>How was your session with <span className="photographer-name">{photographerName || 'your photographer'}</span>?</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="stars-container">
                        {[1, 2, 3, 4, 5].map((index) => (
                            <button
                                key={index}
                                type="button"
                                className={`star ${(hover || rating) >= index ? 'on' : ''}`}
                                onClick={() => setRating(index)}
                                onMouseEnter={() => setHover(index)}
                                onMouseLeave={() => setHover(0)}
                            >
                                ★
                            </button>
                        ))}
                    </div>

                    <div className="form-group">
                        <label htmlFor="feedback">Optional Feedback</label>
                        <textarea
                            id="feedback"
                            rows={4}
                            placeholder="Tell us what you liked or what we can improve..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading || rating === 0}>
                        {loading ? 'Submitting...' : 'Submit Rating'}
                    </button>

                    {error && <div className="error-msg">{error}</div>}
                </form>
            </div>
        </div>
    );
};

export default function RatePhotographerPage() {
    return (
        <Suspense fallback={<div style={{ color: '#fff', textAlign: 'center', marginTop: '100px' }}>Loading...</div>}>
            <RatePhotographerContent />
        </Suspense>
    );
}
