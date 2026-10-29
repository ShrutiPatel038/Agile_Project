import { useState, useEffect } from 'react';

const CountdownTimer = ({ expiryTimestamp, onExpire }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(expiryTimestamp) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        if (!timeLeft.minutes && !timeLeft.seconds) {
            onExpire();
            return;
        }

        const intervalId = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        
        return () => clearInterval(intervalId);
    }, [timeLeft]);

    if (timeLeft.minutes !== undefined) {
        return (
            <span className="font-bold text-red-600 dark:text-red-400">
                {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
        );
    } else {
        return <span className="font-bold text-red-600 dark:text-red-400">Expired</span>;
    }
};

export default CountdownTimer;