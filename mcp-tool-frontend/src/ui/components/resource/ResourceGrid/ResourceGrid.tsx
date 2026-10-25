import { Grid } from '@mui/material';
import type { ResourceResponse } from '../../../../api/types/resource.ts';
import ResourceCard from '../ResourceCard/ResourceCard.tsx';

interface ResourceGridProps {
  resources: ResourceResponse[];
  busyId?: number | null;
  onAnalyze?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const ResourceGrid = ({ resources, busyId = null, onAnalyze, onDelete }: ResourceGridProps) => {
  return (
    <Grid container spacing={2.5}>
      {resources.map((resource) => (
        <Grid key={resource.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <ResourceCard
            resource={resource}
            busy={busyId === resource.id}
            onAnalyze={onAnalyze}
            onDelete={onDelete}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default ResourceGrid;
