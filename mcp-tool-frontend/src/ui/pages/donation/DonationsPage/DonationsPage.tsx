import { Box, Button, CircularProgress, Grid, Typography } from '@mui/material';
import { HEADING_FONT } from '../../../../theme/theme.ts';
import { donationStatusLabel } from '../../../format.ts';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import PageHeader from '../../../components/layout/PageHeader/PageHeader.tsx';
import EmptyState from '../../../components/layout/EmptyState/EmptyState.tsx';
import AddIcon from '@mui/icons-material/Add';
import { useMemo, useState } from 'react';
import type { DonationStatus } from '../../../../api/types/donation.ts';
import useDonations from '../../../../hooks/useDonations.ts';
import DonationBatchCard from '../../../components/donation/DonationBatchCard/DonationBatchCard.tsx';
import SubmitDonationDialog from '../../../components/donation/SubmitDonationDialog/SubmitDonationDialog.tsx';

const STATUSES: DonationStatus[] = ['DRAFT', 'APPROVED', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'FAILED'];

/** The donation dashboard towards doniraj.vezilka.ai. */
const DonationsPage = () => {
  const { donations, loading, busyId, onCreate, onApprove, onSubmit } = useDonations();

  const [newBatchDialogOpen, setNewBatchDialogOpen] = useState<boolean>(false);

  const stats = useMemo(() => {
    const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<DonationStatus, number>;
    let texts = 0;
    for (const batch of donations) {
      byStatus[batch.status] += 1;
      if (batch.status === 'SUBMITTED' || batch.status === 'ACCEPTED') {
        texts += batch.resourceCount;
      }
    }
    return { byStatus, texts };
  }, [donations]);

  return (
    <Box>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress/>
        </Box>
      )}
      {!loading &&
       <>
         <PageHeader
           overline='03 / 03 — Донирај'
           title='Донации'
           subtitle='Групирајте текстови во пакет, одобрете го и испратете го на doniraj.vezilka.ai. Секој текст се испраќа со изворната адреса.'
           actions={
             <Button variant='contained' startIcon={<AddIcon/>} onClick={() => setNewBatchDialogOpen(true)}>
               Нов пакет
             </Button>
           }
         />

         <Box sx={{
           mb: 5, display: 'grid', borderTop: 1, borderBottom: 1, borderColor: 'divider',
           gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)', md: '1.6fr repeat(7, 1fr)' }
         }}>
           <Box sx={{ py: 2.5, pr: 2, gridColumn: { xs: '1 / -1', md: 'auto' }, borderBottom: { xs: 1, md: 0 }, borderColor: 'divider' }}>
             <Typography sx={{ fontFamily: HEADING_FONT, fontSize: '3rem', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
               {stats.texts}
             </Typography>
             <Typography variant='overline' color='text.tertiary' sx={{ display: 'block', mt: 0.5 }}>испратени на Везилка</Typography>
           </Box>
           {[{ label: 'пакети', value: donations.length }, ...STATUSES.map((status) => ({ label: donationStatusLabel[status], value: stats.byStatus[status] }))].map((cell) => (
             <Box key={cell.label} sx={{ py: 2.5, px: { md: 2 }, borderLeft: { md: 1 }, borderColor: 'divider' }}>
               <Typography sx={{ fontFamily: HEADING_FONT, fontSize: '1.6rem', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', color: cell.value ? 'text.primary' : 'text.disabled' }}>
                 {cell.value}
               </Typography>
               <Typography variant='overline' color='text.tertiary'>{cell.label}</Typography>
             </Box>
           ))}
         </Box>

         {donations.length === 0 && (
           <EmptyState
             icon={<VolunteerActivismOutlinedIcon/>}
             title='Сè уште нема донации'
             description='Групирајте ги собраните текстови во пакет и донирајте ги на doniraj.vezilka.ai.'
             action={<Button variant='contained' onClick={() => setNewBatchDialogOpen(true)}>Создај пакет</Button>}
           />
         )}
         <Grid container spacing={2.5}>
           {donations.map((batch) => (
             <Grid key={batch.id} size={{ xs: 12, sm: 6, md: 4 }}>
               <DonationBatchCard
                 batch={batch}
                 busy={busyId === batch.id}
                 onApprove={onApprove}
                 onSubmit={onSubmit}
               />
             </Grid>
           ))}
         </Grid>
       </>}
      <SubmitDonationDialog
        open={newBatchDialogOpen}
        onClose={() => setNewBatchDialogOpen(false)}
        onCreate={onCreate}
      />
    </Box>
  );
};

export default DonationsPage;
