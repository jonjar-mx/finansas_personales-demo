import ClearIcon from '@mui/icons-material/Clear';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Box, CircularProgress, IconButton, InputAdornment, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';

const defaultGetOptionLabel = (option) => String(option || '');

export default function AsyncFreeSoloSelect({
  label,
  value,
  options,
  onChange,
  required = false,
  getOptionLabel = defaultGetOptionLabel,
  getOptionValue = getOptionLabel,
  getValueLabel,
  allowCustomValue = true,
  placeholder = '',
  noOptionsText = '',
  fullWidth = true,
  size,
  sx,
  disabled = false,
  clearable = true,
}) {
  const inputId = useId();
  const pendingChange = useRef(null);
  const lastExternalValue = useRef(String(value || ''));
  const resolveValueLabel = useCallback((nextValue) => {
    if (getValueLabel) return getValueLabel(nextValue, options);
    return String(nextValue || '');
  }, [getValueLabel, options]);
  const [localValue, setLocalValue] = useState(() => resolveValueLabel(value));
  const [focused, setFocused] = useState(false);
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const nextValue = String(value || '');
    if (nextValue !== lastExternalValue.current) {
      lastExternalValue.current = nextValue;
      setLocalValue(resolveValueLabel(value));
    }
  }, [resolveValueLabel, value]);

  useEffect(() => {
    if (!allowCustomValue) setLocalValue(resolveValueLabel(value));
  }, [allowCustomValue, resolveValueLabel, value]);

  useEffect(() => {
    if (!focused) {
      setSearching(false);
      setMatches([]);
      return undefined;
    }

    setSearching(true);
    const search = window.setTimeout(() => {
      const normalizedValue = localValue.trim().toLowerCase();
      const nextMatches = (normalizedValue.length < 2
        ? options
        : options.filter((option) => getOptionLabel(option).toLowerCase().includes(normalizedValue))
      ).slice(0, 60);

      setMatches(nextMatches);
      setSearching(false);
    }, 120);

    return () => window.clearTimeout(search);
  }, [focused, getOptionLabel, localValue, options]);

  useEffect(() => () => {
    if (pendingChange.current) window.clearTimeout(pendingChange.current);
  }, []);

  const emitChange = (nextValue) => {
    if (pendingChange.current) window.clearTimeout(pendingChange.current);

    pendingChange.current = window.setTimeout(() => {
      lastExternalValue.current = String(nextValue || '');
      onChange(nextValue);
      pendingChange.current = null;
    }, 0);
  };

  const updateValue = (nextValue) => {
    setLocalValue(nextValue);
    if (allowCustomValue) emitChange(nextValue);
  };

  const selectOption = (option) => {
    const nextValue = getOptionValue(option);
    const nextLabel = getOptionLabel(option);
    setLocalValue(nextLabel);
    setFocused(false);
    lastExternalValue.current = String(nextValue || '');
    if (pendingChange.current) window.clearTimeout(pendingChange.current);
    pendingChange.current = null;
    onChange(nextValue, option);
  };

  const clearValue = () => {
    if (pendingChange.current) window.clearTimeout(pendingChange.current);
    pendingChange.current = null;
    lastExternalValue.current = '';
    setLocalValue('');
    setFocused(false);
    onChange('');
  };

  const handleBlur = () => {
    window.setTimeout(() => {
      setFocused(false);
      if (!allowCustomValue) setLocalValue(resolveValueLabel(value));
    }, 120);
  };

  const showClearButton = clearable && !disabled && String(localValue || '').length > 0;

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      <TextField
        id={inputId}
        label={label}
        value={localValue}
        onChange={(event) => updateValue(event.target.value)}
        onFocus={() => { if (!disabled) setFocused(true); }}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        fullWidth={fullWidth}
        size={size}
        slotProps={{
          input: showClearButton ? {
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Limpiar">
                  <IconButton
                    aria-label={`Limpiar ${label}`}
                    edge="end"
                    size="small"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={clearValue}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          } : undefined,
        }}
      />
      {!disabled && focused && (searching || matches.length > 0 || noOptionsText) && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 20,
            maxHeight: 240,
            overflowY: 'auto',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {searching ? (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, py: 1.25 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">Buscando...</Typography>
            </Stack>
          ) : matches.length > 0 ? matches.map((option) => (
            <Box
              key={getOptionValue(option) || getOptionLabel(option)}
              component="button"
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                selectOption(option);
              }}
              sx={{
                display: 'block',
                width: '100%',
                px: 1.5,
                py: 1,
                border: 0,
                bgcolor: 'background.paper',
                color: 'text.primary',
                textAlign: 'left',
                cursor: 'pointer',
                font: 'inherit',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              {getOptionLabel(option)}
            </Box>
          )) : (
            <Typography variant="body2" color="text.secondary" sx={{ px: 1.5, py: 1.25 }}>
              {noOptionsText}
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
}
