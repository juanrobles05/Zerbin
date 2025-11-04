import axios from 'axios';
import { API_CONFIG } from '../../utils/constants';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

export const rewardService = {
  getRewards: async () => {
    const response = await apiClient.get('/v1/rewards/');
    return response.data;
  },

  redeemReward: async (userId, rewardId) => {
    const response = await apiClient.post('/v1/rewards/redeem', {
      user_id: userId,
      reward_id: rewardId
    });
    return response.data;
  }
};
