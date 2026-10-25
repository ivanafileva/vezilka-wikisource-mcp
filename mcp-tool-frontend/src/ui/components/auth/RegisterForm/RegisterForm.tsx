import { Box, Button, TextField } from '@mui/material';
import AuthCard from '../AuthCard/AuthCard.tsx';
import { Link } from 'react-router';
import { useState } from 'react';
import * as React from 'react';
import useRegister from '../../../../hooks/useRegister.ts';

interface FormData {
  name: string;
  surname: string;
  email: string;
  username: string;
  password: string;
}

const initialFormData: FormData = {
  name: '',
  surname: '',
  email: '',
  username: '',
  password: ''
};

const RegisterForm = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const { register } = useRegister();

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    await register(formData);
  };

  return (
    <AuthCard title='Регистрација' subtitle='Придружете се на напорите за зачувување на македонскиот јазик.'>
        <Box component='form' onSubmit={(e: React.FormEvent) => { e.preventDefault(); void handleSubmit(); }}>
          <TextField
            fullWidth label='Име'
            name='name'
            margin='normal'
            required
            value={formData.name}
            onChange={handleChange}
          />
          <TextField
            fullWidth label='Презиме'
            name='surname'
            margin='normal'
            required
            value={formData.surname}
            onChange={handleChange}
          />
          <TextField
            fullWidth label='Е-пошта'
            name='email'
            margin='normal'
            required
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            fullWidth label='Корисничко име'
            name='username'
            margin='normal'
            required
            value={formData.username}
            onChange={handleChange}
          />
          <TextField
            fullWidth label='Лозинка'
            name='password'
            type='password'
            margin='normal'
            required
            value={formData.password}
            onChange={handleChange}
          />
          <Button fullWidth variant='contained' type='submit' size='large' sx={{ mt: 2 }}>
            Регистрирај се
          </Button>
          <Button fullWidth variant='text' type='button' sx={{ mt: 1 }} component={Link} to='/login'>
            Веќе имате профил? Најавете се
          </Button>
        </Box>
    </AuthCard>
  );
};

export default RegisterForm;
