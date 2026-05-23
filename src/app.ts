import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.route';
import issueRoutes from './modules/issues/issues.route';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'DevPulse API is running successfully!' 
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);

export default app;