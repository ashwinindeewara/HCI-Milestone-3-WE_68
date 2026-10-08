import apiClient from './api';

export const getClientProfile = async (userId: number) => {
  const response = await apiClient.get(
    `/clients/${userId}/profile`
  );
  return response.data;
};