import { useState } from 'react';
import type { LoginRequest } from '../api/types/user.ts';
import userApi from '../api/userApi.ts';
import { useNavigate } from 'react-router';
import useAuth from './useAuth.ts';
import useSnackbar from './useSnackbar.ts';
import { isAxiosError } from 'axios';
import { errorMessage } from '../api/errorMessage.ts';

const useLogin = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState<boolean>(false);

  const login = async (data: LoginRequest) => {
    setLoading(true);

    try {
      const response = await userApi.login(data);
      authLogin(response.data.token);
      navigate('/');
    } catch (err) {
      showSnackbar(isAxiosError(err) && err.response?.status === 401
        ? 'Погрешно корисничко име или лозинка. Најавете се со корисничкото име, не со е-поштата.'
        : errorMessage(err, 'Најавата не успеа. Обидете се повторно.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return { loading, login };
};

export default useLogin;
