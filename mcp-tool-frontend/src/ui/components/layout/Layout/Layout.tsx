import './Layout.css';
import { Box } from '@mui/material';
import { Outlet } from 'react-router';
import Header from '../Header/Header.tsx';
import Footer from '../Footer/Footer.tsx';
import { pageGutterSx } from '../styles.ts';
import StitchedBorder from '../../../embroidery/StitchedBorder.tsx';

const Layout = () => {
  return (
    <Box className='layout-box'>
      <Header/>
      <StitchedBorder/>
      <Box component='main' className='outlet-container' sx={{ ...pageGutterSx, pt: { xs: 3, md: 5 }, pb: 6 }}>
        <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
          <Outlet/>
        </Box>
      </Box>
      <Footer/>
    </Box>
  );
};

export default Layout;
