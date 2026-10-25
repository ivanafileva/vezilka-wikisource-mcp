import useAuth from '../../../../hooks/useAuth.ts';
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router';
import { boxedIconSx } from '../../layout/styles.ts';
import { HEADING_FONT } from '../../../../theme/theme.ts';

const AuthToggle = () => {
  const { logout, isLoggedIn, user } = useAuth();

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isLoggedIn) {
    return (
      <Button variant='contained' size='small' sx={{ height: 34 }} onClick={() => navigate('/login')}>
        Најави се
      </Button>
    );
  }

  const username = user?.username ?? user?.sub ?? 'user';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1, height: 34, pl: 0.5, pr: { xs: 0.5, sm: 1.25 },
        border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper'
      }}>
        <Box sx={{
          width: 24, height: 24, borderRadius: '6px', display: 'grid', placeItems: 'center',
          bgcolor: 'text.primary', color: 'background.default', fontFamily: HEADING_FONT, fontSize: 13
        }}>
          {username.charAt(0).toUpperCase()}
        </Box>
        <Typography variant='body2' sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 500 }}>
          {username}
        </Typography>
      </Box>
      <Tooltip title='Одјави се'>
        <IconButton onClick={handleLogout} aria-label='Одјави се' sx={boxedIconSx}>
          <LogoutIcon sx={{ fontSize: 16 }}/>
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default AuthToggle;
