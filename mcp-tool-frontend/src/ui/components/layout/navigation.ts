import type { SvgIconComponent } from '@mui/icons-material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import type { Role } from '../../../api/types/user.ts';

export interface NavPage {
  path: string;
  name: string;
  /** Short hint under the name in the side rail, e.g. "Чекор 01". */
  hint?: string;
  icon: SvgIconComponent;
  authenticated: boolean;
  role?: Role;
}

/** The app's pages, shared by the desktop side rail and the mobile drawer. */
export const NAV_PAGES: NavPage[] = [
  { path: '/', name: 'Почетна', icon: HomeOutlinedIcon, authenticated: false },
  { path: '/search-runs', name: 'Пребарување', hint: 'Чекор 01', icon: TravelExploreIcon, authenticated: true },
  { path: '/resources', name: 'Текстови', hint: 'Чекор 02', icon: MenuBookOutlinedIcon, authenticated: true },
  { path: '/donations', name: 'Донации', hint: 'Чекор 03', icon: VolunteerActivismOutlinedIcon, authenticated: true },
  { path: '/playground', name: 'MCP алатки', hint: 'За агенти', icon: HubOutlinedIcon, authenticated: true }
];

export const visibleNavPages = (isLoggedIn: boolean, roles: string[] = []) =>
  NAV_PAGES.filter((page) => (!page.authenticated || isLoggedIn) && (!page.role || roles.includes(page.role)));
