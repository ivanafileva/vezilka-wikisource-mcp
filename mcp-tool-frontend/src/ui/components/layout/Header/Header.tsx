import './Header.css';
import {
  AppBar, Box, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, useScrollTrigger,
  Toolbar, Tooltip, Typography
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { Link, NavLink } from 'react-router';
import { useState } from 'react';
import AuthToggle from '../../auth/AuthToggle/AuthToggle.tsx';
import EmbroideryMark from '../EmbroideryMark/EmbroideryMark.tsx';
import useAuth from '../../../../hooks/useAuth.ts';
import useThemeMode from '../../../../hooks/useThemeMode.ts';
import { visibleNavPages } from '../navigation.ts';
import { boxedIconSx, HEADER_HEIGHT } from '../styles.ts';
import { HEADING_FONT } from '../../../../theme/theme.ts';
import { fabricGridSx } from '../../../embroidery/fabric.ts';

/** The masthead: menu and wordmark on the left, theme toggle and account on the right. The menu opens the navigation drawer. */
const Header = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { isLoggedIn, user } = useAuth();
  const { mode, toggleMode } = useThemeMode();

  const pages = visibleNavPages(isLoggedIn, user?.roles);
  // Transparent over the page's fabric; once scrolled, a frosted background
  // (with its own fabric grid) keeps the controls readable over content.
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 8 });

  return (
    <AppBar position='sticky' sx={(theme) => ({
      ...(scrolled && fabricGridSx(theme)),
      transition: 'background-color 200ms ease, backdrop-filter 200ms ease, box-shadow 200ms ease',
      ...(!scrolled && { backgroundColor: 'transparent', backdropFilter: 'none', boxShadow: 'none' })
    })}>
      <Box sx={{ px: { xs: 2, sm: 3, md: 5 } }}>
        <Toolbar disableGutters sx={{ gap: 1.5, minHeight: HEADER_HEIGHT, height: HEADER_HEIGHT }}>
          <IconButton aria-label='Мени' sx={boxedIconSx} onClick={() => setDrawerOpen(true)}>
            <MenuIcon fontSize='small'/>
          </IconButton>

          <Box component={Link} to='/' sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'text.primary' }}>
            <EmbroideryMark size={26}/>
            <Typography sx={{ fontFamily: HEADING_FONT, fontSize: '1.3rem', letterSpacing: '-0.02em', lineHeight: 1 }}>
              Везилка
            </Typography>
            <Typography variant='overline' color='text.tertiary' sx={{ lineHeight: 1, mt: '3px', display: { xs: 'none', sm: 'block' } }}>
              MCP · Викизвор
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }}/>

          <Tooltip title={mode === 'light' ? 'Темен режим' : 'Светол режим'}>
            <IconButton onClick={toggleMode} aria-label='Промени тема' sx={{ width: 34, height: 34 }}>
              {mode === 'light' ? <DarkModeOutlinedIcon sx={{ fontSize: 18 }}/> : <LightModeOutlinedIcon sx={{ fontSize: 18 }}/>}
            </IconButton>
          </Tooltip>
          <AuthToggle/>
        </Toolbar>
      </Box>

      <Drawer anchor='left' open={drawerOpen} onClose={() => setDrawerOpen(false)}
              slotProps={{ paper: { sx: { bgcolor: 'background.default', borderRight: 1, borderColor: 'divider' } } }}>
        <Box sx={{ width: 272, pt: 2.5 }} role='presentation' onClick={() => setDrawerOpen(false)}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2.5, pb: 2 }}>
            <EmbroideryMark size={24}/>
            <Typography sx={{ fontFamily: HEADING_FONT, fontSize: '1.25rem' }}>Везилка</Typography>
          </Box>
          <List>
            {pages.map((page) => (
              <ListItem key={page.path} disablePadding>
                <ListItemButton
                  component={NavLink}
                  to={page.path}
                  end={page.path === '/'}
                  sx={{ px: 2.5, '&.active': { color: 'primary.main', boxShadow: (theme) => `inset 2px 0 0 ${theme.palette.primary.main}` } }}
                >
                  <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}><page.icon fontSize='small'/></ListItemIcon>
                  <ListItemText primary={page.name} secondary={page.hint}/>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Header;
