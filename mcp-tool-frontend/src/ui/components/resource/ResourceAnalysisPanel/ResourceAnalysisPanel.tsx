import { Box, Button, Chip, Typography } from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import type { ResourceAnalysisResponse } from '../../../../api/types/resource.ts';
import ConfidenceChip from '../ConfidenceChip/ConfidenceChip.tsx';
import { HEADING_FONT } from '../../../../theme/theme.ts';
import { formatDateTime, formatNumber } from '../../../format.ts';

interface ResourceAnalysisPanelProps {
  analysis: ResourceAnalysisResponse | null;
  wordCount?: number | null;
  analyzing?: boolean;
  onAnalyze?: () => void;
}

const panelSx = { border: 1, borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper', p: 2.5 } as const;

/**
 * The analysis of one resource: extractive summary, keywords, sentence/word
 * counts and Macedonian-language confidence — or a call-to-action to run it.
 */
const ResourceAnalysisPanel = ({ analysis, wordCount, analyzing = false, onAnalyze }: ResourceAnalysisPanelProps) => {
  if (!analysis) {
    return (
      <Box sx={panelSx}>
        <Typography variant='overline' color='text.tertiary' sx={{ display: 'block', mb: 1 }}>Анализа</Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Овој текст сè уште не е анализиран. Анализата извлекува резиме, најчестите клучни зборови
          (без македонски стоп-зборови) и основна статистика за текстот.
        </Typography>
        {onAnalyze && (
          <Button variant='contained' startIcon={<InsightsIcon/>} onClick={onAnalyze} disabled={analyzing}>
            Анализирај
          </Button>
        )}
      </Box>
    );
  }

  const keywords = (analysis.keywords ?? '')
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return (
    <Box sx={panelSx}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant='overline' color='text.tertiary'>Анализа</Typography>
        {onAnalyze && (
          <Button size='small' startIcon={<InsightsIcon/>} onClick={onAnalyze} disabled={analyzing}>
            Повторно анализирај
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: 1, borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
        <Figure label='Реченици' value={formatNumber(analysis.sentenceCount ?? 0)}/>
        <Figure label='Зборови' value={wordCount != null ? formatNumber(wordCount) : '—'}/>
        <Box sx={{ py: 1.5, pl: 1.5, borderLeft: 1, borderColor: 'divider' }}>
          <Typography variant='overline' color='text.tertiary' sx={{ display: 'block', lineHeight: 1.4, mb: 0.75 }}>Македонски</Typography>
          <ConfidenceChip confidence={analysis.macedonianConfidence}/>
        </Box>
      </Box>

      <Typography variant='overline' color='text.tertiary' sx={{ display: 'block', mb: 0.5 }}>Резиме</Typography>
      <Typography sx={{ mb: 2.5, whiteSpace: 'pre-line', fontFamily: HEADING_FONT, fontStyle: 'italic', fontSize: '0.98rem', lineHeight: 1.65 }}>
        {analysis.summary || '—'}
      </Typography>

      <Typography variant='overline' color='text.tertiary' sx={{ display: 'block', mb: 0.75 }}>Клучни зборови</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
        {keywords.length === 0 && <Typography variant='body2'>—</Typography>}
        {keywords.map((keyword) => <Chip key={keyword} label={keyword} size='small' variant='outlined'/>)}
      </Box>

      {analysis.analyzedAt && (
        <Typography variant='caption' color='text.tertiary'>
          Анализирано: {formatDateTime(analysis.analyzedAt)}
        </Typography>
      )}
    </Box>
  );
};

const Figure = ({ label, value }: { label: string; value: number | string }) => (
  <Box sx={{ py: 1.5, pr: 1.5, '& + &': { pl: 1.5, borderLeft: 1, borderColor: 'divider' } }}>
    <Typography variant='overline' color='text.tertiary' sx={{ display: 'block', lineHeight: 1.4 }}>{label}</Typography>
    <Typography sx={{ fontFamily: HEADING_FONT, fontSize: '1.6rem', lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>
      {value}
    </Typography>
  </Box>
);

export default ResourceAnalysisPanel;
