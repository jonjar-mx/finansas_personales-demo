import { Box, Container } from '@mui/material';
import Header from './Header';

export default function Layout({ children }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#07111f' }}>
      <Header />
      <Container
        maxWidth="lg"
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 2.5, sm: 4 },
        }}
      >
        {children}
      </Container>
    </Box>
  );
}
