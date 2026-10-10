import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';

export default function MonthFilter({ countLabel, monthLabel, labelVariant = 'body1', labelSx, onPrevMonth, onNextMonth, sx }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap" sx={sx}>
      <Tooltip title="Mes anterior">
        <IconButton onClick={onPrevMonth} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }}>
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>
      {monthLabel && (
        <Typography variant={labelVariant} sx={{ fontWeight: 800, textAlign: 'center', minWidth: { xs: 120, sm: 150 }, ...labelSx }}>
          {monthLabel}
        </Typography>
      )}
      <Tooltip title="Mes siguiente">
        <IconButton onClick={onNextMonth} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }}>
          <ArrowForwardIcon />
        </IconButton>
      </Tooltip>
      {countLabel && <Chip label={countLabel} />}
    </Stack>
  );
}
