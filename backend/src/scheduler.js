const cron = require('node-cron');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Schedule task to run at midnight every day
cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled task to check for upcoming renewals...');
    
    try {
        // Call the API endpoint to check for upcoming renewals
        const response = await axios.post(
            `${process.env.API_URL}/api/notifications/check-renewals`,
            {},
            {
                headers: {
                    'x-api-key': process.env.CRON_API_KEY
                }
            }
        );
        
        console.log('Scheduled task completed:', response.data);

    } catch (error) {
        console.error('Error running scheduled task:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
});

console.log('Notification scheduler started');
