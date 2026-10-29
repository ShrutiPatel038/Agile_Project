import logger from '../utils/logger.js';

// Booking confirmation emails are sent inline by queueService.addEmailJob, so no separate worker runs.
export const startEmailWorker = () => {
    logger.info('Email worker ready (inline sending)');
};
