import { Box, Button, TextField } from '@mui/material';
import AuthCard from '../AuthCard/AuthCard.tsx';
import { useState } from 'react';
import * as React from 'react';
import { useNavigate } from 'react-router';
import useLogin from '../../../../hooks/useLogin.ts';

interface FormData {
  username: string;
  password: string;
}

const initialFormData: FormData = {
  username: '',
  password: ''
};

const LoginForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>(initialFormData);

  const { login } = useLogin();

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    await login(formData);
  };

  return (
    <AuthCard title='Најава' subtitle='Добредојдовте назад. Продолжете со собирање македонски текстови.'>
        <Box component='form' onSubmit={(e: React.FormEvent) => { e.preventDefault(); void handleSubmit(); }}>
          <TextField
            fullWidth
            label='Корисничко име'
            name='username'
            margin='normal'
            required
            value={formData.username}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            label='Лозинка'
            name='password'
            type='password'
            margin='normal'
            required
            value={formData.password}
            onChange={handleChange}
          />
          <Button
            fullWidth
            variant='contained'
            type='submit'
            size='large'
            sx={{ mt: 2 }}
          >
            Најави се
          </Button>
          <Button
            fullWidth
            variant='text'
            type='button'
            sx={{ mt: 1 }}
            onClick={() => navigate('/register')}
          >
            Немате профил? Регистрирајте се
          </Button>
        </Box>
    </AuthCard>
  );
};

export default LoginForm;
