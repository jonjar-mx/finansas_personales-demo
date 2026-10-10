import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useContext, useEffect, useState } from 'react';
import { BudgetContext } from '../context/BudgetContextValue';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';

const emptyCategory = {
  name: '',
  color: '#3b82f6',
  icon: '',
  sortOrder: 0,
};

export default function Categories() {
  const {
    categories,
    loading,
    saving,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useContext(BudgetContext);
  const [editingCategory, setEditingCategory] = useState(null);
  const { register, handleSubmit, reset } = useForm({ defaultValues: emptyCategory });

  useEffect(() => {
    if (editingCategory) {
      reset({
        name: editingCategory.name,
        color: editingCategory.color || '#3b82f6',
        icon: editingCategory.icon || '',
        sortOrder: editingCategory.sortOrder || 0,
      });
    } else {
      reset(emptyCategory);
    }
  }, [editingCategory, reset]);

  const onSubmit = async (category) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, category);
    } else {
      await createCategory(category);
    }
    setEditingCategory(null);
    reset(emptyCategory);
  };

  const handleCancel = () => {
    setEditingCategory(null);
    reset(emptyCategory);
  };

  return (
    <Stack spacing={{ xs: 2.5, md: 3 }}>
      <Box>
        <Typography variant="overline" sx={{ color: 'primary.light', fontWeight: 800 }}>
          Catalog
        </Typography>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, fontWeight: 800 }}>
          Categories
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h6">
            {editingCategory ? 'Edit category' : 'Add category'}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1.2fr 0.8fr',
                lg: '1.4fr 0.8fr 1fr 0.7fr auto auto',
              },
              gap: 2,
              alignItems: 'center',
            }}
          >
            <TextField label="Name" fullWidth {...register('name', { required: true })} />
            <TextField label="Color" type="color" fullWidth {...register('color')} />
            <TextField label="Icon" fullWidth {...register('icon')} />
            <TextField label="Order" type="number" fullWidth {...register('sortOrder', { valueAsNumber: true })} />
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              disabled={saving}
              sx={{ minHeight: 48 }}
            >
              {editingCategory ? 'Update' : 'Save'}
            </Button>
            {editingCategory && (
              <Button variant="outlined" size="large" onClick={handleCancel} sx={{ minHeight: 48 }}>
                Cancel
              </Button>
            )}
          </Box>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        {categories.map((category) => (
          <Paper
            key={category.id}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 2,
                    bgcolor: category.color || 'primary.main',
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>
                    {category.name}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip label={`Order ${category.sortOrder}`} size="small" variant="outlined" />
                    {category.icon && <Chip label={category.icon} size="small" />}
                  </Stack>
                </Box>
              </Stack>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Edit category">
                  <IconButton onClick={() => setEditingCategory(category)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete category">
                  <IconButton
                    color="error"
                    onClick={() => deleteCategory(category.id)}
                    disabled={loading || saving}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Box>
    </Stack>
  );
}
