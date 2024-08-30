const axios = require('axios');

const API_KEY = '265708e5913a4bbe8057efb48af4d182';
const BASE_URL = 'https://api.rawg.io/api';

const rawgApi = {
    getGames: async (page = 1, pageSize = 20, ordering = '-added') => {
        try {
            console.log(`Fetching games from RAWG API: page ${page}, pageSize ${pageSize}, ordering ${ordering}`);
            const response = await axios.get(`${BASE_URL}/games`, {
                params: {
                    key: API_KEY,
                    page: page,
                    page_size: pageSize,
                    ordering: ordering
                }
            });
            console.log('RAWG API response received');
            return response.data;
        } catch (error) {
            console.error('Error fetching games from RAWG API:', error.message);
            console.error('Error details:', error.response ? error.response.data : 'No response data');
            throw error;
        }
    },

    searchGames: async (query, page = 1, pageSize = 20) => {
        try {
            const response = await axios.get(`${BASE_URL}/games`, {
                params: {
                    key: API_KEY,
                    search: query,
                    page: page,
                    page_size: pageSize
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error searching games from RAWG API:', error);
            throw error;
        }
    },

    getGameDetails: async (gameId) => {
        try {
            const response = await axios.get(`${BASE_URL}/games/${gameId}`, {
                params: {
                    key: API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching game details from RAWG API:', error);
            throw error;
        }
    }
};

module.exports = rawgApi;