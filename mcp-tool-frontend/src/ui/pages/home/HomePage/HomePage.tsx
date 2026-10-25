import { Alert, Box, Button, CircularProgress, Grid, Link, Typography } from '@mui/material';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import InsightsIcon from '@mui/icons-material/Insights';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Link as RouterLink } from 'react-router';
import * as React from 'react';
import useAuth from '../../../../hooks/useAuth.ts';
import useStats from '../../../../hooks/useStats.ts';
import type { CorpusStats } from '../../../../api/types/stats.ts';
import CrossStitchHero from '../../../components/home/CrossStitchHero/CrossStitchHero.tsx';
import StatTile from '../../../components/home/StatTile/StatTile.tsx';
import StepCard from '../../../components/home/StepCard/StepCard.tsx';
import McpConnectCard from '../../../components/home/McpConnectCard/McpConnectCard.tsx';

const TILES: { key: keyof CorpusStats; label: string; to: string; icon: React.ReactNode }[] = [
  { key: 'searchRuns', label: 'Пребарувања', to: '/search-runs', icon: <ManageSearchIcon/> },
  { key: 'resources', label: 'Собрани текстови', to: '/resources', icon: <MenuBookOutlinedIcon/> },
  { key: 'analyzedResources', label: 'Анализирани текстови', to: '/resources', icon: <AutoGraphIcon/> },
  { key: 'donationBatches', label: 'Пакети за донација', to: '/donations', icon: <Inventory2OutlinedIcon/> },
  { key: 'donatedResources', label: 'Донирани текстови', to: '/donations', icon: <FavoriteBorderIcon/> }
];

const STEPS = [
  {
    title: 'Пребарај', tool: 'search_resources', icon: <TravelExploreIcon/>,
    description: 'Пребарување низ целиот текст на македонскиот Викизвор. Секој резултат се презема како чист текст, со зачувани прекини на стиховите, и добива оценка колку е македонски.'
  },
  {
    title: 'Анализирај', tool: 'analyze_resource', icon: <InsightsIcon/>,
    description: 'Клучни зборови без македонски стоп-зборови, екстрактивно резиме, број на реченици и зборови и оценка на сигурноста за јазикот.'
  },
  {
    title: 'Донирај', tool: 'donate_resource', icon: <VolunteerActivismIcon/>,
    description: 'Групирајте текстови во пакет, одобрете го и испратете го на doniraj.vezilka.ai со изворната адреса, за секоја донација да го зачува своето потекло.'
  }
];

/** A numbered section heading: "02 — Корпус". */
const SectionHeading = ({ index, title, aside }: { index: string; title: string; aside?: React.ReactNode }) => (
  <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2, mb: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
      <Typography variant='overline' color='text.tertiary'>{index}</Typography>
      <Typography variant='h3' component='h2' sx={{ fontSize: { xs: '1.8rem', md: '2.2rem' } }}>{title}</Typography>
    </Box>
    {aside}
  </Box>
);

/** Landing page: an embroidered hero, the three-step flow, corpus statistics and how to connect an MCP agent. */
const HomePage = () => {
  const { isLoggedIn } = useAuth();
  const { stats, loading, error } = useStats(isLoggedIn);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 7, md: 10 } }}>
      <CrossStitchHero>
        <Box>
          <Typography variant='overline' color='text.tertiary' sx={{ display: 'block', mb: 2.5 }}>
            Лист 001 — MCP алатка · Ресурси на македонски јазик
          </Typography>
          <Typography variant='h1' sx={{ fontSize: { xs: '2.5rem', sm: '4rem', md: '4rem', lg: '4.75rem' }, mb: 3 }}>
            Викизвор
            <Box component='span' sx={{ display: 'block' }}>
              <Box component='span' sx={{ color: 'primary.main' }}>→</Box> Везилка
            </Box>
          </Typography>
          <Typography color='text.secondary' sx={{ fontSize: { xs: '1.05rem', md: '1.2rem' }, lineHeight: 1.6, maxWidth: 540, mb: 3 }}>
            Пребарувајте и анализирајте македонски текстови од јавниот домен на Викизвор (народни песни,
            поезија, проза и историски документи) и донирајте ги на Везилка за да помогнете во зачувувањето
            на македонскиот јазик.
          </Typography>
          <Typography variant='body2' color='text.tertiary' sx={{ mb: 4 }}>
            Извор <Link href='https://mk.wikisource.org' target='_blank' rel='noreferrer'>mk.wikisource.org</Link>
            {' · '}Одредиште <Link href='https://doniraj.vezilka.ai' target='_blank' rel='noreferrer'>doniraj.vezilka.ai</Link>
            {' · '}6 MCP алатки
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {isLoggedIn ? (
              <>
                <Button variant='contained' size='large' endIcon={<ArrowForwardIcon/>}
                        component={RouterLink} to='/search-runs'>
                  Започни пребарување
                </Button>
                <Button variant='outlined' size='large' component={RouterLink} to='/resources'>
                  Прегледај текстови
                </Button>
              </>
            ) : (
              <>
                <Button variant='contained' size='large' component={RouterLink} to='/login'>Најави се</Button>
                <Button variant='outlined' size='large' component={RouterLink} to='/register'>Регистрирај се</Button>
              </>
            )}
          </Box>
        </Box>
      </CrossStitchHero>

      <Box component='section'>
        <SectionHeading index='01' title='Како функционира'/>
        <Grid container spacing={{ xs: 4, md: 5 }}>
          {STEPS.map((step, index) => (
            <Grid key={step.title} size={{ xs: 12, md: 4 }}>
              <StepCard step={index + 1} total={STEPS.length} {...step}/>
            </Grid>
          ))}
        </Grid>
      </Box>

      {isLoggedIn && (
        <Box component='section'>
          <SectionHeading
            index='02'
            title='Корпус'
            aside={<Typography variant='caption' color='text.tertiary'>Тековни бројки од овој сервер</Typography>}
          />
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress size={28}/>
            </Box>
          )}
          {!loading && error && <Alert severity='error'>{error}</Alert>}
          {!loading && stats && (
            <Box sx={{
              display: 'grid', borderTop: 1, borderBottom: 1, borderColor: 'divider',
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
              '& > *': { borderColor: 'divider' },
              '& > * + *': { borderLeft: { sm: 1 }, borderColor: 'divider' }
            }}>
              {TILES.map((tile) => (
                <StatTile key={tile.key} label={tile.label} value={stats[tile.key]} icon={tile.icon} to={tile.to}/>
              ))}
            </Box>
          )}
        </Box>
      )}

      {isLoggedIn && (
        <Box component='section'>
          <McpConnectCard/>
        </Box>
      )}
    </Box>
  );
};

export default HomePage;
